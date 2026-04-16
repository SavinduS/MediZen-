const getPagination = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (p - 1) * l;
  return { skip, limit: l, page: p };
};

module.exports = { getPagination };
