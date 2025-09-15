/**
 * A simple debounce function to limit how often an async function is called.
 * This version correctly handles promise-based functions, ensuring that only
 * the final, "stopped typing" event triggers the function call.
 * @param func The async function to debounce.
 * @param delay The delay in milliseconds.
 */
function debounce<T extends (...args: any[]) => Promise<any>>(func: T, delay: number): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | undefined> {
  let timeoutId: NodeJS.Timeout | undefined;
  let latestPromise: Promise<Awaited<ReturnType<T>> | undefined> | undefined;
  let latestResolve: ((value: Awaited<ReturnType<T>> | undefined) => void) | undefined;

  return function (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | undefined> {
    // Clear any existing timeout to reset the timer on every new keystroke
    clearTimeout(timeoutId);

    // If there is no pending promise, create one
    if (!latestPromise) {
      latestPromise = new Promise(resolve => {
        latestResolve = resolve;
      });
    }

    // Set a new timeout
    timeoutId = setTimeout(async () => {
      try {
        const result = await func(...args);
        if (latestResolve) {
          latestResolve(result);
        }
      } catch (error) {
        console.error('Debounced function failed:', error);
        if (latestResolve) {
          latestResolve(undefined);
        }
      } finally {
        // Clear the promise and resolve function after the debounced call is complete
        latestPromise = undefined;
        latestResolve = undefined;
      }
    }, delay);

    return latestPromise;
  };
}


function isEmptyOrWhitespace(str: string | null | undefined): boolean {
  return str === null || str === undefined || str.trim().length === 0;
}

export { debounce, isEmptyOrWhitespace };
