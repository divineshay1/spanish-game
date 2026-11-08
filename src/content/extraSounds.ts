/**
 * Extra pronunciation rules added from the pronunciation key you shared
 * (rewritten in our own words). Shown in El Observatorio → Sonidos after
 * the prototype's rules.
 */
import type { SoundRule } from './index';

export const EXTRA_SOUNDS: SoundRule[] = [
  ['O is clean', 'Say o like the start of "obey", with no "oo" glide at the end. Short and round.', ['solo', 'como', 'todo']],
  ['B between vowels', 'Between two vowels the b is so soft your lips barely touch.', ['abundancia', 'saber', 'trabajo']],
  ['D at the end', 'A d at the end of a word, or between vowels, is a very soft th, like in "the". Say both d sounds in ciudad that way.', ['ciudad', 'verdad', 'usted']],
  ['CC sounds like ks', 'The first c is a k, the second (before e or i) is an s.', ['acción', 'lección', 'dirección']],
  ['T is crisp', 'Say t with the tongue on the back of the teeth and no puff of air, like the tt in "attractive".', ['patio', 'simpático', 'tomate']],
  ['Y on its own', 'Y alone means "and" and sounds like ee. Before a vowel it sounds like the y in "yes".', ['y', 'yo', 'mayo']],
  ['QUI and GUI', 'que = keh, qui = kee, gue = geh, gui = gee. The u is silent in all four.', ['quiero', 'guitarra', 'guerra']],
];
