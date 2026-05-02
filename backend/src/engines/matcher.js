function normalizeText(value) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\b(pvt|private|limited|ltd|llp|m\/s|ms|industries|industry|enterprise|enterprises|products)\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jaroWinkler(s1, s2) {
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  const m = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - m);
    const end = Math.min(i + m + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let t = 0;
  let k = 0;

  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) t++;
    k++;
  }

  const transpositions = t / 2;

  const jaro =
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions) / matches) /
    3;

  let prefix = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

function tokenSimilarity(a, b) {
  const tokensA = new Set(normalizeText(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeText(b).split(" ").filter(Boolean));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = [...tokensA].filter((token) => tokensB.has(token)).length;
  const union = new Set([...tokensA, ...tokensB]).size;

  return intersection / union;
}

function scorePair(a, b) {
  const samePan = a.pan_hash && b.pan_hash && a.pan_hash === b.pan_hash;
  const sameGstin = a.gstin_hash && b.gstin_hash && a.gstin_hash === b.gstin_hash;
  const samePhone = a.phone_hash && b.phone_hash && a.phone_hash === b.phone_hash;
  const sameProprietor =
    a.proprietor_hash && b.proprietor_hash && a.proprietor_hash === b.proprietor_hash;

  const nameScore = jaroWinkler(
    normalizeText(a.business_name),
    normalizeText(b.business_name)
  );

  const addressScore = tokenSimilarity(a.address, b.address);
  const pinScore = a.pin_code && a.pin_code === b.pin_code ? 1 : 0;
  const sectorScore = a.sector && b.sector && a.sector === b.sector ? 1 : 0;

  let score = 0;

  if (samePan) score += 0.35;
  if (sameGstin) score += 0.35;

  score += nameScore * 0.18;
  score += addressScore * 0.16;
  score += pinScore * 0.08;
  score += sectorScore * 0.04;

  if (samePhone) score += 0.08;
  if (sameProprietor) score += 0.08;

  score = Math.min(score, 1);

  let decision = "reject";
  if (score >= 0.9 || samePan || sameGstin) decision = "auto_link";
  else if (score >= 0.6) decision = "review";

  const reasons = [];

  if (samePan) reasons.push("PAN blind-hash matched");
  if (sameGstin) reasons.push("GSTIN blind-hash matched");
  if (samePhone) reasons.push("Phone blind-hash matched");
  if (sameProprietor) reasons.push("Proprietor blind-hash matched");
  if (nameScore > 0.8) reasons.push(`High name similarity (${Math.round(nameScore * 100)}%)`);
  if (addressScore > 0.5)
    reasons.push(`Address token overlap (${Math.round(addressScore * 100)}%)`);
  if (pinScore) reasons.push("Same PIN code");
  if (sectorScore) reasons.push("Same sector");

  return {
    score: Number(score.toFixed(3)),
    decision,
    features: {
      nameScore: Number(nameScore.toFixed(3)),
      addressScore: Number(addressScore.toFixed(3)),
      pinScore,
      sectorScore,
      samePan: Boolean(samePan),
      sameGstin: Boolean(sameGstin),
      samePhone: Boolean(samePhone),
      sameProprietor: Boolean(sameProprietor)
    },
    explanation: reasons.join("; ") || "Insufficient matching evidence"
  };
}

module.exports = {
  normalizeText,
  jaroWinkler,
  tokenSimilarity,
  scorePair
};
