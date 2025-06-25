import { expect, test } from 'vitest'
import { fx } from "../src/index";


test('myFunction', () => {

  const getSprite = (obj: unknown, key: 'front_default' | 'back_default') => {
    if (typeof obj !== 'object' || obj === null) return fx.fail("Not an object");
    if ('sprites' in obj === false || typeof obj.sprites !== 'object' || obj.sprites === null) return fx.fail("Missing sprites");
    if (key in obj.sprites === false || typeof obj.sprites[key] !== 'string') return fx.fail(`Missing sprite ${key}`);
    return fx.ok(obj.sprites[key]);
  }

  const fetchPokemonSpriteImage = async (name: string) => {
    const res = await fetch(`https://pokeapi.co/api/v2/${name}`);
    if (res.ok === false) return fx.fail("Fetch failed");
    const json = await res.json(); // may still throw
    return getSprite(json, 'front_default');
  }
  
  // in your app
  
  const main = async () => {
    const [err, sprite] = await fx.runPromise(fetchPokemonSpriteImage('ditto'));
    if (err !== null) return null;
    return sprite;
  }
})
