# 🌊 Rusty na Ilha — Site institucional

Site institucional do **Rusty na Ilha**, restaurante ribeirinho na Ilha das Onças, em frente a Belém-PA. Estático, rápido, responsivo e portável (HTML + CSS + JS puro, sem build).

Identidade: **azul-rio `#23158E` + verde-selva `#247044` + areia `#FBF7EE`**, tipografia *Bricolage Grotesque* / *Hanken Grotesk* / *Caveat*, ilustrações e ícones autorais em SVG, cantos orgânicos e microinterações.

---

## 📁 Estrutura

```
rusty-na-ilha/
├── index.html          # Home (hero, sobre, experiência, cardápio-prévia, como chegar, contato)
├── cardapio.html       # Cardápio completo (4 categorias)
├── 404.html            # Página de erro personalizada
├── manifest.json       # PWA
├── robots.txt          # SEO
├── sitemap.xml         # SEO
└── assets/
    ├── css/styles.css       # Design system completo (tokens, componentes, responsivo, dark band)
    ├── js/
    │   ├── menu-data.js      # ⭐ FONTE ÚNICA do cardápio (edite aqui)
    │   └── main.js           # Header, menu mobile, reveal, abas e render do cardápio
    └── img/                  # Logo (azul/branca), favicon, ícones PWA, imagem OG
```

O cardápio das duas páginas (prévia na home + completo) é gerado **a partir do mesmo arquivo** `assets/js/menu-data.js`. Edite só ele e os dois lugares atualizam.

---

## ▶️ Como rodar localmente

Como há arquivos `.js`/`.css` externos, abra com um servidor local (recomendado) em vez de duplo-clique:

```bash
# dentro da pasta do projeto
python -m http.server 5173
# abra http://localhost:5173
```

Ou use a extensão **Live Server** do VS Code.

## 🚀 Deploy

É um site estático — sobe direto em **Vercel, Netlify, GitHub Pages, Cloudflare Pages** ou qualquer hospedagem. Sem etapa de build. Basta enviar a pasta inteira.

No Netlify, o `404.html` já vira a página de erro automaticamente. Na Vercel também.

---

## ✅ Antes de publicar — itens a finalizar

1. **Cardápio** — os itens e preços em `assets/js/menu-data.js` foram transcritos do **cardápio oficial**. Se houver reajuste ou prato novo, é só editar esse arquivo (a home e a página de cardápio atualizam juntas). Pratos têm `preco` (individual) e, quando servem 2, `preco2` (casal).
2. **Fotos reais** — os pratos usam ilustrações SVG (placeholders). Para usar fotos:
   - troque o bloco `.plate` por uma `<img>`, **ou**
   - mantenha o `.plate` e injete a foto via a variável CSS `--photo`:
     ```html
     <div class="plate" style="--photo:url('assets/img/filhote.jpg')"></div>
     ```
   - Em produção/Next.js, prefira `next/image` para otimização.
3. ~~**Domínio real**~~ ✅ já está aplicado — `https://rustynailha.com.br/` em canonicais, `og:`, `sitemap.xml` e `robots.txt`.
4. **Coordenadas (opcional)** — o `geo` no JSON-LD da home (`index.html`) é aproximado da Ilha das Onças. Ajuste `latitude`/`longitude` para o ponto exato, se quiser.
5. **Confira os dados** — telefone `(91) 99316-1815`, endereço de embarque (Porto Shalom, Rua Siqueira Mendes, 160 — Cidade Velha), horários (**Sáb e Dom**, 10h–18h, mais feriados escolhidos) e redes (`@rustynailha`, Facebook). Estão preenchidos com base em pesquisa pública; valide.

---

## 🎨 Acessibilidade & SEO (já incluídos)

- Contraste **WCAG AA** em todos os textos, navegação por teclado, `aria-*`, foco visível, `prefers-reduced-motion`.
- HTML semântico, meta tags completas, **Open Graph + Twitter Card** (imagem pronta em `assets/img/og-image.png`), **JSON-LD** `Restaurant`, sitemap e robots.
- Sem dependências externas além das fontes do Google (carregam sozinhas online).

---

Feito com 💙 por [Lucas Vaz](https://lucasvazportfolio.vercel.app)
