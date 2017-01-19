// @flow
/* eslint-disable import/prefer-default-export */

import gravatar from 'gravatar';

import * as baseTheme from '../../../styles/themes/base';
import { get } from '../../immutable';

import type {
  GithubIssue,
  GithubPullRequest,
  ThemeObject,
} from '../../types';

export function isPullRequest(issue: GithubIssue | GithubPullRequest) {
  return issue && (
    get(issue, 'pull_request') ||
    get(issue, 'merged_at') ||
    (get(issue, 'html_url') && get(issue, 'html_url').indexOf('pull') >= 0) ||
    (get(issue, 'url') && get(issue, 'url').indexOf('pull') >= 0)
  );
}

export function getPullRequestIconAndColor(
  pullRequest: GithubPullRequest,
  theme?: ThemeObject = baseTheme,
) : { color: string, icon: string } {
  const merged = get(pullRequest, 'merged_at');
  const state = merged ? 'merged' : get(pullRequest, 'state');

  switch (state) {
    case 'open':
      return { icon: 'git-pull-request', color: theme.green };

    case 'closed':
      return { icon: 'git-pull-request', color: theme.red };

    case 'merged':
      return { icon: 'git-merge', color: theme.purple };

    default:
      return { icon: 'git-pull-request' };
  }
}

export function getIssueIconAndColor(issue: GithubIssue, theme?: ThemeObject = baseTheme)
: { color: string, icon: string } {
  const state = get(issue, 'state');

  if (isPullRequest(issue)) {
    return getPullRequestIconAndColor(issue, theme);
  }

  switch (state) {
    case 'open':
      return { icon: 'issue-opened', color: theme.green };

    case 'closed':
      return { icon: 'issue-closed', color: theme.red };

    default:
      return { icon: 'issue-opened' };
  }
}

export function getOwnerAndRepo(repoFullName: string): { owner: ?string, repo: ?string} {
  const repoSplitedNames = (repoFullName || '').trim().split('/').filter(Boolean);

  const owner = (repoSplitedNames[0] || '').trim();
  const repo = (repoSplitedNames[1] || '').trim();

  return { owner, repo };
}

export function getOrgAvatar(orgName: string) {
  return orgName ? `https://github.com/${orgName}.png` : '';
}

export function getUserAvatar(userName: string) {
  return userName ? `https://github.com/${userName}.png` : '';
}

export function tryGetUsernameFromGithubEmail(email: string) {
  if (!email) return '';

  const emailSplit = email.split('@');
  if (emailSplit.length === 2 && emailSplit[1] === 'users.noreply.github.com') return emailSplit[0];

  return '';
}

export function getUserAvatarByEmail(email: string, { size, ...otherOptions }: { size?: number }) {
  const sizeSteps = 50; // sizes will be multiples of 50 for caching (e.g 50, 100, 150, ...)
  const steppedSize = !size ? sizeSteps : sizeSteps * Math.max(1, Math.ceil(size / sizeSteps));

  const username = tryGetUsernameFromGithubEmail(email);
  if (username) return getUserAvatar(username);

  const options = { size: steppedSize, d: 'retro', ...otherOptions };
  return `https:${gravatar.url(email, options)}`.replace('??', '?');
}
