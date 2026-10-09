// githubUser must come from GitHub's trusted issue event, never submitted JSON.
export function assignSubmissionOwner(item, previous, githubUser) {
  const id = Number(githubUser?.id);
  const login = githubUser?.login;
  if (!Number.isSafeInteger(id) || id < 1 || typeof login !== 'string' || !/^[A-Za-z0-9-]{1,39}$/.test(login)) {
    throw new Error('A verified GitHub issue author is required');
  }
  if (previous && previous.owner?.github_id !== id) {
    throw new Error(previous.owner ? 'Only the original GitHub author can update this item' : 'This curated item has no user owner; contact a maintainer');
  }
  return { ...item, owner: { github_id: id, github_login: login } };
}
