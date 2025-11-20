import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as https from 'https';
import * as child_process from 'child_process';
import * as net from 'net';
import * as vscode from 'vscode';
import { promisify } from 'util';
import * as stream from 'stream';
const pipeline = promisify(stream.pipeline);

async function fileExists(p: string): Promise<boolean> {
    try {
        await fs.promises.access(p, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

async function waitForPort(port: number, host = '127.0.0.1', timeoutMs = 30_000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const ok = await new Promise<boolean>(resolve => {
            const sock = new net.Socket();
            sock.setTimeout(2000);
            sock.once('error', () => { sock.destroy(); resolve(false); });
            sock.once('timeout', () => { sock.destroy(); resolve(false); });
            sock.connect(port, host, () => { sock.end(); resolve(true); });
        });
        if (ok) return true;
        await new Promise(r => setTimeout(r, 1000));
    }
    return false;
}

function spawnDetached(cmdPath: string, args: string[], outLog?: string): child_process.ChildProcess {
    let stdio: any = 'ignore';
    if (outLog) {
        const out = fs.openSync(outLog, 'a');
        stdio = ['ignore', out, out];
    }
    const child = child_process.spawn(cmdPath, args, { detached: true, stdio });
    child.unref();
    return child;
}

async function downloadLatestReleaseAsset(targetPath: string, timeoutMs = 5 * 60 * 1000): Promise<void> {
    const apiUrl = 'https://api.github.com/repos/qtopie/homa/releases/latest';
    const userAgent = 'vscode-sql-y/auto-downloader';

    const metadata: any = await new Promise((resolve, reject) => {
        const req = https.get(apiUrl, { headers: { 'User-Agent': userAgent, 'Accept': 'application/vnd.github.v3+json' } }, res => {
            let buf = '';
            res.on('data', d => buf += d.toString());
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(buf)); } catch (e) { reject(e); }
                } else {
                    reject(new Error(`GitHub API returned ${res.statusCode}: ${buf}`));
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(timeoutMs, () => { req.destroy(new Error('GitHub metadata request timeout')); });
    });

    const platform = process.platform; // 'linux' | 'darwin' | 'win32'
    const arch = process.arch; // 'x64' | 'arm64' ...
    const assets = metadata.assets || [];
    const candidates = assets.filter((a: any) => {
        const name: string = a.name || '';
        // heuristics: name contains platform and/or arch
        return name.includes(platform) || name.includes(`${platform}-${arch}`) || name.includes(arch);
    });

    if (!candidates.length) {
        throw new Error('No suitable release asset found for this platform/arch. Please install homa manually.');
    }

    const asset = candidates[0];
    const url = asset.browser_download_url;
    if (!url) throw new Error('Selected asset has no download URL');

    const tmpPath = targetPath + '.tmp';
    await new Promise<void>((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': userAgent } }, res => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                const fileStream = fs.createWriteStream(tmpPath, { mode: 0o755 });
                pipeline(res, fileStream).then(resolve, reject);
            } else {
                let body = '';
                res.on('data', d => body += d.toString());
                res.on('end', () => reject(new Error(`Download failed ${res.statusCode}: ${body}`)));
            }
        });
        req.on('error', reject);
        req.setTimeout(timeoutMs, () => { req.destroy(new Error('Download timeout')); });
    });

    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.rename(tmpPath, targetPath);
    await fs.promises.chmod(targetPath, 0o755);
}

export async function ensureHomaRunning(): Promise<boolean> {
    const homaName = process.platform === 'win32' ? 'homa.exe' : 'homa';
    const homaPath = path.join(os.homedir(), '.cosmos', 'bin', homaName);
    const port = 1234;

    // 1) if port already open, good
    if (await waitForPort(port, '127.0.0.1', 1000)) return true;

    // 2) if binary missing, offer to download
    if (!await fileExists(homaPath)) {
        const choice = await vscode.window.showInformationMessage(
            'homa backend is required but not found. Download and install latest homa to ~/.cosmos/bin/homa?',
            'Download and Start',
            'Cancel'
        );
        if (choice !== 'Download and Start') return false;

        try {
            await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Downloading homa...', cancellable: false }, async () => {
                await downloadLatestReleaseAsset(homaPath);
            });
        } catch (e: any) {
            vscode.window.showErrorMessage(`Failed to download homa: ${e.message || e}`);
            return false;
        }
    }

    // 3) start homa
    try {
        const logDir = path.join(os.homedir(), '.cosmos', 'logs');
        await fs.promises.mkdir(logDir, { recursive: true });
        const logfile = path.join(logDir, 'homa.log');
        spawnDetached(homaPath, ['--port', String(port)], logfile);
    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to start homa: ${e.message || e}`);
        return false;
    }

    // 4) wait for port
    const ready = await waitForPort(port, '127.0.0.1', 30_000);
    if (!ready) {
        vscode.window.showErrorMessage('homa did not start within timeout. Check logs at ~/.cosmos/logs/homa.log');
        return false;
    }

    return true;
}
