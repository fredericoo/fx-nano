# fx-nano

hyper lightweight (300bytes gzip) typesafe error library loosely inspired by golang and effect

## incremental adoption

no need to rewrite your whole app. you can start with smaller and simpler functions at the edges of your app just fine

## true error type-safety

even the most robust libraries don’t actually return type-safe errors because they fail to consider javascript’s goblin nature

e.g.:
```ts
const getPokemonSpriteImage = async (name: string) => {
  const res = await fetch(`https://pokeapi.co/api/v2/${name}`);
  const json = await res.json();
  if (typeof json.sprites.front_default === 'string') return json.sprites.front_default;
  throw new Error("Missing sprite");
}
```

this function seems harmless and straightforward. it could still fail in many ways:
- requester has no connection (e.g.: "Fetch failed")
- response is not json (e.g.: "Unexpected token '<' at position 0")
- `json.sprites` does not exist
- `json.sprites.front_default` does not exist

you can make it type-safe by first returning `fx.ok` or `fx.fail`:
```ts
import { fx } from "fx-nano";

const getPokemonSpriteImage = async (name: string) => {
  const res = await fetch(`https://pokeapi.co/api/v2/${name}`);
  const json = await res.json();
  if (typeof json.sprites.front_default === 'string') return fx.ok(json.sprites.front_default);
  return fx.fail("Missing sprite");
}
```

and then when you need to use it, wrap it in `fx.runPromise`:

```ts
import { fx } from "fx-nano";

const getPokemonSpriteImage = async (name: string) => {
  const res = await fetch(`https://pokeapi.co/api/v2/${name}`);
  const json = await res.json();
  if (typeof json.sprites.front_default === 'string') return fx.ok(json.sprites.front_default);
  return fx.fail("Missing sprite");
}

// in your app

const main = () => {
  const [error, sprite] = fx.runPromise(getPokemonSprite('ditto'));
}
```


## Installation

```bash
npm add fx-nano
```
