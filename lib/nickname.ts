export const inappropriateNicknameMessage =
  "Jsi vtipný, ale sprostě se tu mluvit nebude.";

// Match common Czech and English insults, including separated letters and leetspeak.
const inappropriateRoots = [
  "kurv", "kurev", "pico", "pica", "picu", "pici", "pice", "picov", "pizd",
  "kokot", "curak", "zmrd", "mrd", "jeb", "srac",
  "srack", "hovn", "hajzl", "debil", "idiot",
  "kreten", "blbec", "blbeck", "buzerant", "buzna",
  "cigan", "negr", "nigg", "fuck", "shit", "bitch", "cunt", "asshole", "faggot",
];

export function isInappropriateNickname(value: string): boolean {
  const normalized = value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[013457@$!]/g, (character) => ({
      "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t",
      "@": "a", "$": "s", "!": "i",
    })[character] ?? character)
    .replace(/[^a-z]/g, "")
    .replace(/([a-z])\1+/g, "$1");

  return inappropriateRoots.some((root) => normalized.includes(root.replace(/([a-z])\1+/g, "$1")));
}
