/**
 * Helpers pour le système de niveaux
 */

function xpRequiredForNext(level, curve) {
  const base = Number(curve?.base) || 100;
  const factor = Number(curve?.factor) || 1.2;
  const required = Math.round(base * Math.pow(factor, Math.max(0, level)));
  return Math.max(1, required);
}

function totalXpAtLevel(level, curve) {
  const base = Number(curve?.base) || 100;
  const factor = Number(curve?.factor) || 1.2;
  if (factor === 1) return Math.max(0, Math.round(base * Math.max(0, level)));
  const l = Math.max(0, level);
  const sum = base * (Math.pow(factor, l) - 1) / (factor - 1);
  return Math.max(0, Math.round(sum));
}

function xpToLevel(xp, curve) {
  const base = Number(curve?.base) || 100;
  const factor = Number(curve?.factor) || 1.2;
  const totalXpGiven = Math.max(0, xp);
  
  if (factor <= 1) {
    const lvl = Math.floor(totalXpGiven / Math.max(1, base));
    return { level: lvl, xpSinceLevel: totalXpGiven - (lvl * base) };
  }
  
  let level = 0;
  let requiredXp = base;
  let totalXp = 0;
  
  while (totalXp + requiredXp <= totalXpGiven && level < 9999) {
    totalXp += requiredXp;
    level++;
    requiredXp = Math.round(base * Math.pow(factor, level));
  }
  
  const xpSinceLevel = totalXpGiven - totalXp;
  return { level, xpSinceLevel };
}

function getLastRewardForLevel(levels, currentLevel) {
  const entries = Object.entries(levels.rewards || {});
  let best = null;
  for (const [lvlStr, rid] of entries) {
    const ln = Number(lvlStr);
    if (Number.isFinite(ln) && ln <= (currentLevel || 0)) {
      if (!best || ln > best.level) best = { level: ln, roleId: rid };
    }
  }
  return best;
}

function getNextRewardForLevel(levels, currentLevel) {
  const entries = Object.entries(levels.rewards || {});
  let best = null;
  for (const [lvlStr, rid] of entries) {
    const ln = Number(lvlStr);
    if (Number.isFinite(ln) && ln > (currentLevel || 0)) {
      if (!best || ln < best.level) best = { level: ln, roleId: rid };
    }
  }
  return best;
}

function memberHasCertifiedRole(memberOrMention, levels) {
  try {
    const certIds = new Set(Array.isArray(levels?.cards?.certifiedRoleIds) ? levels.cards.certifiedRoleIds : []);
    return Boolean(memberOrMention?.roles?.cache?.some(r => certIds.has(r.id)));
  } catch (_) { return false; }
}

function memberHasFemaleRole(memberOrMention, levels) {
  try {
    const femaleIds = new Set(Array.isArray(levels?.cards?.femaleRoleIds) ? levels.cards.femaleRoleIds : []);
    return Boolean(memberOrMention?.roles?.cache?.some(r => femaleIds.has(r.id)));
  } catch (_) { return false; }
}

function memberDisplayName(guild, memberOrMention, userIdFallback) {
  if (memberOrMention && memberOrMention.user) {
    return memberOrMention.nickname || memberOrMention.user.username;
  }
  if (userIdFallback) {
    const m = guild.members.cache.get(userIdFallback);
    if (m) return m.nickname || m.user.username;
  }
  return userIdFallback ? `Membre ${userIdFallback}` : 'Membre';
}

async function fetchMember(guild, userId) {
  return guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
}

module.exports = {
  xpRequiredForNext,
  totalXpAtLevel,
  xpToLevel,
  getLastRewardForLevel,
  getNextRewardForLevel,
  memberHasCertifiedRole,
  memberHasFemaleRole,
  memberDisplayName,
  fetchMember
};
