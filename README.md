# Dongwoo Suk - Computational Design Portfolio

English portfolio: https://dongwoosuk.github.io/portfolio/

Computational Design Specialist / Project Designer at Steinberg Hart.

## Local development

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## Publish

Push changes to main. GitHub Actions builds and deploys the English site automatically.

```sh
npm run build:pages
```

The static site exports to .next-pages/ with the /portfolio base path. The build script prefixes public media paths for GitHub Pages. Generated output is excluded from Git.

## Selected work

- ADG Unit Layout & Facade Pilot
- Cal Poly Student Housing Bldg-C Facade
- joseki
- 5x5 Building
- Rhino / Grasshopper MCP

Built with Next.js, React, TypeScript, and GitHub Pages. Project media lives in public/work/. Older presentation sources remain in the repository for reference.
