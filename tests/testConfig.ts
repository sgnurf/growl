/**
 * Shared configuration for all integration tests.
 *
 * testRunId is generated once per process — all tests in the same run share it.
 * Every test-created project name is prefixed with TEST_PREFIX so the cleanup
 * script can delete only test data, leaving manually-created projects untouched.
 */
export const testRunId = crypto.randomUUID().slice(0, 8);
export const TEST_PREFIX = '__test__';

/** Wraps a human-readable base name with the test prefix and run ID. */
export function testName(base: string): string {
    return `${TEST_PREFIX}-${testRunId} ${base}`;
}
