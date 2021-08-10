import { v4 as v4UUID } from 'uuid';
import Enumerable from './Utils/Enumerable';
import Storage from './Utils/Storage';
import associatePropType from './Utils/associatePropType';
import ContentWindow from './Utils/ContentWindow';
import fetchComponent, { neboURL, componentURL } from './Utils/fetchComponent';

const displaySizes = {
  sm: {
    min: 320,
    max: 767,
  },
  md: {
    min: 768,
    max: 1023,
  },
  lg: {
    min: 1024,
    max: 1199,
  },
  xl: { min: 1200 },
};

const classNames = (...names) => Array.from(new Set(
  names.flatMap((name) => (name || '').split(' ')),
))
  .filter(Boolean)
  .join(' ');

const evaluate = (value, args = {}) => {
  try {
    // eslint-disable-next-line no-new-func
    return Function(...Object.keys(args), `"use strict"; return (${value});`)(...Object.values(args));
  } catch {
    return null;
  }
};

const isNullish = (value) => typeof value === 'undefined' || value === null;

const capitalize = (input) => (input ? `${input[0].toUpperCase()}${input.slice(1)}` : '');

const breakWords = (input, withWord = (word) => word) => {
  const splitOnRegEx = /\s|[A-Z]|_/;
  const skippable = /\s|_/;
  const words = [''];
  for (let i = 0; i < input.length; i += 1) {
    if (splitOnRegEx.test(input[i])) {
      words.push(skippable.test(input[i]) ? '' : input[i]);
    } else {
      words[words.length - 1] += input[i];
    }
  }
  const wordModifier = (word) => withWord(word.toLowerCase());
  return words.filter(Boolean)
    .map(wordModifier);
};

const humanize = (input, titleize = false) => {
  const withWord = titleize ? capitalize : (word) => word;
  return capitalize(breakWords(input, withWord)
    .join(' '));
};

const kebabCase = (input) => breakWords(input)
  .join('-');

const canUseDOM = !!(
  (typeof window !== 'undefined' && window.document && window.document.createElement)
);

const uuid = () => {
  try {
    return v4UUID();
  } catch {
    let time = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      // eslint-disable-next-line no-bitwise
      const random = (time + Math.random() * 16) % 16 | 0;
      time = Math.floor(time / 16);
      // eslint-disable-next-line no-mixed-operators,no-bitwise
      return (char === 'x' ? random : (random & 0x3 | 0x8)).toString(16);
    });
  }
};

export {
  ContentWindow, Enumerable, Storage, associatePropType, displaySizes, classNames, canUseDOM,
  evaluate, isNullish, humanize, capitalize, kebabCase, neboURL, componentURL, fetchComponent, uuid,
};
