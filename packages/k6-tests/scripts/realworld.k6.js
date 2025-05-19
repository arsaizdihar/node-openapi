/* eslint-disable no-undef */
import http from 'k6/http';
import { check, sleep, group } from 'k6';

// BASE_URL should be set via an environment variable when running k6.
// Example: k6 run -e BASE_URL='http://localhost:3000/api' script.js
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api'; // Default if not set
const USER_EMAIL_PREFIX = 'k6user_rw';
const USER_PASSWORD = 'k6password';
const startTime = Date.now();

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Simulate ramp-up of traffic
    { duration: '1m', target: 10 }, // Stay at 10 users for 1 minute
    { duration: '10s', target: 0 }, // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
    http_req_failed: ['rate<0.01'], // Error rate should be less than 1%
  },
};

// k6 global variables __VU and __ITER are used here by k6 engine
function getUnique() {
  return `${startTime}-${__VU}-${__ITER}`;
}

export default function () {
  let token = null;
  let articleSlug = null;
  let commentId = null;
  const uniqueUserSuffix = getUnique();
  const userEmail = `${USER_EMAIL_PREFIX}${uniqueUserSuffix}@example.com`;
  const username = `${USER_EMAIL_PREFIX}${uniqueUserSuffix}`;
  let articleTitle = `k6 Test Article ${uniqueUserSuffix}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  group('User Authentication', function () {
    group('Register User', function () {
      const registerPayload = JSON.stringify({
        user: {
          username: username,
          email: userEmail,
          password: USER_PASSWORD,
        },
      });
      const res = http.post(`${BASE_URL}/users`, registerPayload, {
        headers: headers,
        tags: { name: 'RegisterUser' },
      });
      check(res, {
        'Registration: status is 201 or 200': (r) =>
          r.status === 201 || r.status === 200,
      });
      if (res.status === 201 || res.status === 200) {
        const body = res.json();
        if (body && body.user && body.user.token) {
          token = body.user.token;
          headers['Authorization'] = `Token ${token}`;
        }
        check(res, { 'Registration: got token': () => token !== null });
      }
    });

    // If registration failed to get a token (e.g. user already exists from previous run), try to login
    if (!token) {
      group('Login User (fallback)', function () {
        const loginPayload = JSON.stringify({
          user: {
            email: userEmail,
            password: USER_PASSWORD,
          },
        });
        const res = http.post(`${BASE_URL}/users/login`, loginPayload, {
          headers: headers,
          tags: { name: 'LoginUser' },
        });
        check(res, {
          'Login: status is 200': (r) => r.status === 200,
        });
        if (res.status === 200) {
          const body = res.json();
          if (body && body.user && body.user.token) {
            token = body.user.token;
            headers['Authorization'] = `Token ${token}`;
          }
          check(res, { 'Login: got token': () => token !== null });
        }
      });
    }
  });

  if (!token) {
    console.error(
      'Failed to get token for ' +
        userEmail +
        ', cannot proceed with authenticated requests.',
    );
    return;
  }

  group('Articles', function () {
    group('Create Article', function () {
      const articlePayload = JSON.stringify({
        article: {
          title: articleTitle,
          description: 'K6 load test article description',
          body: 'This article was created by a k6 load test script.',
          tagList: ['k6', 'testing', 'loadtest'],
        },
      });
      const res = http.post(`${BASE_URL}/articles`, articlePayload, {
        headers: headers,
        tags: { name: 'CreateArticle' },
      });
      check(res, {
        'Create Article: status is 201 or 200': (r) =>
          r.status === 201 || r.status === 200,
      });
      if (res.status === 201 || res.status === 200) {
        const body = res.json();
        if (body && body.article && body.article.slug) {
          articleSlug = body.article.slug;
        }
        check(res, { 'Create Article: got slug': () => articleSlug !== null });
      }
    });

    sleep(1);

    group('List Articles (Global Feed)', function () {
      const res = http.get(`${BASE_URL}/articles?limit=10&offset=0`, {
        headers: headers,
        tags: { name: 'ListArticles' },
      });
      check(res, {
        'List Articles: status is 200': (r) => r.status === 200,
        'List Articles: contains articles array': (r) =>
          r.json() && typeof r.json().articles !== 'undefined',
      });
    });

    sleep(1);

    group('List Articles (User Feed)', function () {
      const res = http.get(`${BASE_URL}/articles/feed?limit=10&offset=0`, {
        headers: headers,
        tags: { name: 'ListFeed' },
      });
      check(res, {
        'List Feed: status is 200': (r) => r.status === 200,
        'List Feed: contains articles array': (r) =>
          r.json() && typeof r.json().articles !== 'undefined',
      });
    });

    if (articleSlug) {
      sleep(1);
      group('Get Specific Article', function () {
        const res = http.get(`${BASE_URL}/articles/${articleSlug}`, {
          headers: headers,
          tags: { name: 'GetArticle' },
        });
        check(res, {
          'Get Article: status is 200': (r) => r.status === 200,
          'Get Article: slug matches': (r) =>
            r.json() &&
            r.json().article &&
            r.json().article.slug === articleSlug,
        });
      });

      sleep(1);
      group('Add Comment to Article', function () {
        const commentPayload = JSON.stringify({
          comment: {
            body: `k6 test comment ${uniqueUserSuffix}`,
          },
        });
        const res = http.post(
          `${BASE_URL}/articles/${articleSlug}/comments`,
          commentPayload,
          { headers: headers, tags: { name: 'AddComment' } },
        );
        check(res, {
          'Add Comment: status is 200 or 201': (r) =>
            r.status === 200 || r.status === 201,
        });
        if (res.status === 200 || res.status === 201) {
          const body = res.json();
          if (body && body.comment && body.comment.id) {
            commentId = body.comment.id;
          }
          check(res, {
            'Add Comment: got comment ID': () => commentId !== null,
          });
        }
      });

      sleep(1);
      group('Favorite Article', function () {
        const res = http.post(
          `${BASE_URL}/articles/${articleSlug}/favorite`,
          null,
          { headers: headers, tags: { name: 'FavoriteArticle' } },
        );
        check(res, {
          'Favorite Article: status is 200': (r) => r.status === 200,
          'Favorite Article: favorited is true': (r) =>
            r.json() && r.json().article && r.json().article.favorited === true,
        });
      });

      sleep(1);
      group('Unfavorite Article', function () {
        const res = http.del(
          `${BASE_URL}/articles/${articleSlug}/favorite`,
          null,
          { headers: headers, tags: { name: 'UnfavoriteArticle' } },
        );
        check(res, {
          'Unfavorite Article: status is 200': (r) => r.status === 200,
          'Unfavorite Article: favorited is false': (r) =>
            r.json() &&
            r.json().article &&
            r.json().article.favorited === false,
        });
      });

      if (commentId) {
        sleep(1);
        group('Delete Comment', function () {
          const res = http.del(
            `${BASE_URL}/articles/${articleSlug}/comments/${commentId}`,
            null,
            { headers: headers, tags: { name: 'DeleteComment' } },
          );
          check(res, {
            'Delete Comment: status is 200 or 204': (r) =>
              r.status === 200 || r.status === 204,
          });
        });
      }

      sleep(1);
      group('Delete Article', function () {
        const res = http.del(`${BASE_URL}/articles/${articleSlug}`, null, {
          headers: headers,
          tags: { name: 'DeleteArticle' },
        });
        check(res, {
          'Delete Article: status is 200 or 204': (r) =>
            r.status === 200 || r.status === 204,
        });
      });
    } else {
      console.warn(
        'Article slug not found for ' +
          articleTitle +
          ', skipping article-specific tests.',
      );
    }
  });

  group('Tags', function () {
    group('List Tags', function () {
      const res = http.get(`${BASE_URL}/tags`, {
        headers: headers,
        tags: { name: 'ListTags' },
      });
      check(res, {
        'List Tags: status is 200': (r) => r.status === 200,
        'List Tags: contains tags array': (r) =>
          r.json() && typeof r.json().tags !== 'undefined',
      });
    });
  });

  sleep(1);
}
