const _ = require("lodash");

const equals = (lst_1, lst_2) => {
  const [head, ...tail] = lst_1;
  const [head1, ...tail1] = lst_2;
  if (tail.length === 0 && tail1.length === 0) return head === head1;
  return head === head1 && equals(tail, tail1);
};

const diff = (lst_1, lst_2) => {
  return _.difference(lst_1, lst_2);
};

module.exports = {
  equals,
  diff
};
