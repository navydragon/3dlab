// A routing shell cannot assert that a record exists without a repository.
// Replace this state with actual repository resolution in the content slice.
export const contentState = { status: 'not-connected' } as const;
