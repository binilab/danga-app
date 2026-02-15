export const MAX_POST_TAGS = 5;
export const MIN_POST_TAG_LENGTH = 1;
export const MAX_POST_TAG_LENGTH = 20;

/**
 * 태그 토큰을 정규화해서 저장 가능한 형태(앞뒤 공백 제거, # 제거)로 변환합니다.
 */
function normalizeTagToken(token: string) {
  return token.replaceAll("#", "").trim();
}

/**
 * 태그 입력 문자열을 공백/쉼표 기준으로 분리하고 중복 제거된 배열로 변환합니다.
 */
export function parseTagInput(value: string) {
  const tokens = value
    .split(/[\s,]+/g)
    .map((token) => normalizeTagToken(token))
    .filter((token) => token.length > 0);
  const uniqueTags: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    const dedupeKey = token.toLocaleLowerCase();

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    uniqueTags.push(token);
  }

  return uniqueTags;
}

/**
 * API payload의 다양한 입력 형태(string|string[])를 태그 배열로 정규화합니다.
 */
export function normalizeTagsFromUnknown(value: unknown) {
  if (typeof value === "string") {
    return parseTagInput(value);
  }

  if (Array.isArray(value)) {
    const joined = value
      .filter((item): item is string => typeof item === "string")
      .join(" ");

    return parseTagInput(joined);
  }

  return [] as string[];
}

/**
 * 게시글 저장 전 태그 개수/길이 제약을 검사합니다.
 */
export function validatePostTags(tags: string[]) {
  if (tags.length > MAX_POST_TAGS) {
    return `태그는 최대 ${MAX_POST_TAGS}개까지 입력할 수 있습니다.`;
  }

  for (const tag of tags) {
    if (tag.length < MIN_POST_TAG_LENGTH || tag.length > MAX_POST_TAG_LENGTH) {
      return `각 태그는 ${MIN_POST_TAG_LENGTH}자 이상 ${MAX_POST_TAG_LENGTH}자 이하로 입력해주세요.`;
    }
  }

  return null;
}

/**
 * URL query의 tag 값을 안전한 단일 태그로 정리합니다.
 */
export function normalizeTagQueryValue(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = parseTagInput(value);
  const firstTag = parsed[0];

  if (!firstTag) {
    return null;
  }

  if (firstTag.length > MAX_POST_TAG_LENGTH) {
    return null;
  }

  return firstTag;
}
