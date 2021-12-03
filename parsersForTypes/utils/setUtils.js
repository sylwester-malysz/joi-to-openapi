const setEquality = (as, bs) => {
  if (as.size !== bs.size) return false;
  return [...as].every(elm => {
    if (elm instanceof Set) {
      return [...bs].some(setElm => setEquality(elm, setElm));
    }

    return bs.has(elm);
  });
};

const eqContains = (as, bs) => {
  if (bs instanceof Set) {
    return [...as].some(elm => setEquality(bs, elm));
  }

  return as.has(bs);
};

const subset = (as, bs) => {
  return [...as].every(elm => bs.has(elm));
};

const superset = (as, bs) => {
  return subset(bs, as);
};

const insert = (set, elm) => {
  if (!eqContains(set, elm)) set.add(elm);

  return set;
};

const union = (setA, setB) => {
  return [...setB].reduce((set, elm) => insert(set, elm), new Set(setA));
};

const diff = (setA, setB) => {
  return [...setA].reduce((set, elm) => {
    if (!eqContains(setB, elm)) {
      return insert(set, elm);
    }

    return set;
  }, new Set());
};

module.exports = {
  eqContains,
  superset,
  subset,
  union,
  diff,
  setEquality,
  insert
};
