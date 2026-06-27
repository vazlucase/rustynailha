/* =====================================================================
   RUSTY NA ILHA — menu-data.js
   FONTE ÚNICA do cardápio (home + página de cardápio).
   Dados transcritos do cardápio OFICIAL do Rusty na Ilha.
   Pratos principais têm dois preços: individual e casal (serve 2).
   Observações da casa: couvert artístico R$ 8,00 por pessoa,
   não fazemos alteração de pratos/drinks, proibida a entrada de
   alimentos e bebidas (consultar valores para rolha).
   ===================================================================== */
window.RUSTY_MENU = [
  {
    id: "entradas",
    titulo: "Entradas & Petiscos",
    eyebrow: "pra começar",
    icon: "oyster",
    plate: "river",
    legenda: "do rio pra mesa",
    itens: [
      { nome: "Tacacá", preco: "R$ 25", destaque: true, desc: "Tucupi, jambu, goma de tapioca e camarão seco." },
      { nome: "Casquinha de Caranguejo", preco: "R$ 32", tags: ["sazonal"], desc: "Acompanha farofa. Sujeito à disponibilidade." },
      { nome: "Ostra", preco: "R$ 37", desc: "Temperadas com sal e limão · 6 unidades." },
      { nome: "Batata Frita", preco: "R$ 30", desc: "Com queijo parmesão e molho." },
      { nome: "Isca de Peixe", preco: "R$ 60", desc: "Acompanha farofa, vinagrete e molho." },
      { nome: "Isca de Pirarucu", preco: "R$ 70", desc: "Acompanha farofa, vinagrete e molho." },
      { nome: "Bolinho de Pirarucu", preco: "R$ 50", desc: "Oito bolinhos, acompanha molho." },
      { nome: "Mexilhão Salteado", preco: "R$ 70", desc: "Acompanha farofa e vinagrete." },
      { nome: "Filé com Fritas", preco: "R$ 85", desc: "Acompanha farofa e molho." },
      { nome: "Camarão Ebiten", preco: "R$ 90", destaque: true, desc: "Tempurá de camarão, jambu e cebola." },
      { nome: "Camarão Empanado", preco: "R$ 80", desc: "Acompanha farofa, vinagrete e molho." },
      { nome: "Camarão Alho e Óleo", preco: "R$ 80", desc: "Acompanha farofa e vinagrete." }
    ]
  },
  {
    id: "peixes",
    titulo: "Peixes",
    eyebrow: "o queridinho da casa",
    icon: "fish",
    plate: "jungle",
    legenda: "filhote & pescada",
    grupos: [
      {
        sub: "Filhote",
        itens: [
          { nome: "Filhote Paraense", preco: "R$ 80", preco2: "R$ 150", destaque: true, desc: "Posta de filhote frito, arroz com jambu, camarão e redução de tucupi." },
          { nome: "Filhote ao Molho de Tucupi", preco: "R$ 80", preco2: "R$ 150", desc: "Posta de filhote frito imerso em redução de tucupi, arroz com ervas e farofa." },
          { nome: "Filhote com Shimeji", preco: "R$ 80", preco2: "R$ 150", desc: "Posta de filhote frito recheado com shimeji na manteiga, arroz cremoso." },
          { nome: "Filhote com Legumes", preco: "R$ 75", preco2: "R$ 140", desc: "Posta de filhote frito, legumes salteados e salada crua." },
          { nome: "Filhote com Maionese de Chicória", preco: "R$ 80", preco2: "R$ 150", desc: "Posta de filhote frito coberto com maionese de chicória, macaxeira palha, arroz branco e farofa." }
        ]
      },
      {
        sub: "Pescada",
        itens: [
          { nome: "Pescada Paraense", preco: "R$ 70", preco2: "R$ 130", desc: "Filé de pescada amarela frita, arroz com jambu e vinagrete de feijão manteiguinha." },
          { nome: "Pescada ao Molho de Camarão", preco: "R$ 75", preco2: "R$ 140", desc: "Filé de pescada amarela empanada, arroz com ervas, ao molho de camarão." },
          { nome: "Pescada Frita", preco: "R$ 70", preco2: "R$ 130", desc: "Filé de pescada empanada, arroz com ervas, batata frita e vinagrete." },
          { nome: "Pescada com Banana", preco: "R$ 70", preco2: "R$ 130", desc: "Filé de pescada frita, purê de batata, arroz com ervas, banana frita e farofa." },
          { nome: "Pescada com Legumes", preco: "R$ 70", preco2: "R$ 130", desc: "Filé de pescada amarela frita, legumes salteados e salada crua." }
        ]
      }
    ]
  },
  {
    id: "frutos-carnes",
    titulo: "Camarões, Mariscos & Carnes",
    eyebrow: "do mar e da brasa",
    icon: "utensils",
    plate: "sunset",
    legenda: "fartura paraense",
    grupos: [
      {
        sub: "Camarões & Mariscos",
        itens: [
          { nome: "Paelha Paraense", preco: "R$ 75", preco2: "R$ 140", destaque: true, desc: "Arroz com camarão, mexilhão, caranguejo e dadinhos de peixe." },
          { nome: "Camarão Paraense", preco: "R$ 75", preco2: "R$ 140", desc: "Camarão empanado, arroz com redução de tucupi e jambu, e crispy de couve." },
          { nome: "Camarão Crocante", preco: "R$ 75", preco2: "R$ 140", desc: "Camarão empanado crocante, arroz cremoso, finalizado com crispy de couve." }
        ]
      },
      {
        sub: "Filé Bovino",
        itens: [
          { nome: "Filé Grelhado", preco: "R$ 85", preco2: "R$ 160", destaque: true, desc: "Filé mignon grelhado, arroz cremoso, crispy de couve e batata frita." },
          { nome: "Filé Marajoara", preco: "R$ 85", preco2: "R$ 160", desc: "Filé mignon grelhado, queijo de búfala maçaricado, arroz biro-biro e batata frita." },
          { nome: "Filé com Shimeji", preco: "R$ 85", preco2: "R$ 160", desc: "Filé mignon grelhado recheado com shimeji na manteiga, purê de batata." },
          { nome: "Filé com Legumes", preco: "R$ 80", preco2: "R$ 150", desc: "Filé mignon grelhado, legumes salteados e salada crua." }
        ]
      }
    ]
  },
  {
    id: "leves",
    titulo: "Saladas, Vegano & Kids",
    eyebrow: "mais leve",
    icon: "leaf",
    plate: "sand",
    legenda: "pra todo mundo",
    grupos: [
      {
        sub: "Saladas & Vegano",
        itens: [
          { nome: "Salada de Camarão", preco: "R$ 37", preco2: "R$ 70", desc: "Camarões salteados, mix de folhas, tomate e parmesão." },
          { nome: "Mix Vegano", preco: "R$ 37", preco2: "R$ 70", tags: ["vegano"], desc: "Mix de folhas, legumes salteados e vinagrete de feijão manteiguinha." }
        ]
      },
      {
        sub: "Kids · até 13 anos",
        itens: [
          { nome: "Filé Kids", preco: "R$ 60", tags: ["kids"], desc: "Filé em cubos, arroz branco, batata frita e farofa." },
          { nome: "Peixe Kids", preco: "R$ 50", tags: ["kids"], desc: "Iscas de peixe, arroz branco, batata frita e farofa." }
        ]
      }
    ]
  },
  {
    id: "sobremesas",
    titulo: "Sobremesas",
    eyebrow: "pra adoçar",
    icon: "cake",
    plate: "deep",
    legenda: "doçura da terra",
    itens: [
      { nome: "Alfajor Paraense", preco: "R$ 22", destaque: true, desc: "Creme de cupuaçu com alfajor e farofa doce de castanhas." },
      { nome: "Choco Paraense", preco: "R$ 22", desc: "Ganache de chocolate, creme de cupuaçu e bolinho de chocolate." },
      { nome: "Tijela de Açaí", preco: "R$ 30", destaque: true, desc: "Açaí da casa, acompanha farofa e molho." },
      { nome: "Cafezinho Coado", preco: "R$ 4", desc: "Pra fechar a refeição." }
    ]
  },
  {
    id: "drinks",
    titulo: "Drinks Autorais",
    eyebrow: "pra brindar",
    icon: "cocktail",
    plate: "sunset",
    legenda: "estupidamente gelados",
    nota: "Não fazemos alteração de drinks.",
    grupos: [
      {
        sub: "Tradicionais",
        itens: [
          { nome: "Caipirinha", preco: "R$ 22", desc: "Cachaça, limão e açúcar." },
          { nome: "Treme", preco: "R$ 28", destaque: true, desc: "Cachaça de jambu, taperebá, jambu cozido e açúcar." },
          { nome: "Caipirinha de Jambu", preco: "R$ 26", desc: "Cachaça de jambu, limão e açúcar." },
          { nome: "Caipiroska Nacional", preco: "R$ 26", desc: "Vodka nacional · limão, morango, taperebá ou cupuaçu." },
          { nome: "Caipiroska Importada", preco: "R$ 30", desc: "Vodka importada · limão, morango, taperebá ou cupuaçu." },
          { nome: "Aperol Spritz", preco: "R$ 35", desc: "Aperol, prosecco e água com gás." },
          { nome: "Negroni", preco: "R$ 28", desc: "Gin, vermute rosso e campari." },
          { nome: "Mojito", preco: "R$ 26", desc: "Rum, limão, hortelã e água com gás." }
        ]
      },
      {
        sub: "Gin's & Vodka",
        itens: [
          { nome: "Gin Tônica", preco: "R$ 27", desc: "Gin, tônica e limão." },
          { nome: "Gin Tropical", preco: "R$ 29", desc: "Gin, maracujá, energético tropical e xarope cítrico." },
          { nome: "Melancita", preco: "R$ 29", desc: "Gin, limão e energético de melancia." },
          { nome: "Sweet Tropical", preco: "R$ 30", desc: "Gin, morango, hibisco e energético de açaí." },
          { nome: "Gin Green", preco: "R$ 27", desc: "Gin, limão, hortelã e energético de maçã verde." },
          { nome: "Summer", preco: "R$ 25", desc: "Vodka, morango e energético de pêssego com morango." },
          { nome: "Nascer do Sol", preco: "R$ 27", desc: "Vodka, suco de laranja e Monin." },
          { nome: "Lemon Drop", preco: "R$ 25", desc: "Vodka, licor de laranja e limão." }
        ]
      },
      {
        sub: "Sem álcool",
        itens: [
          { nome: "Tropical Zero", preco: "R$ 22", desc: "Maracujá, energético tropical e xarope cítrico." },
          { nome: "Melancita Zero", preco: "R$ 22", desc: "Limão e energético de melancia." },
          { nome: "Sweet Zero", preco: "R$ 24", desc: "Morango, hibisco e energético de açaí." },
          { nome: "Pink Lemonade", preco: "R$ 24", desc: "Suco de limão, morango e Monin." }
        ]
      }
    ]
  },
  {
    id: "bar",
    titulo: "Cervejas, Doses & Bebidas",
    eyebrow: "pra acompanhar",
    icon: "droplet",
    plate: "river",
    legenda: "geladíssimas",
    grupos: [
      {
        sub: "Cervejas",
        itens: [
          { nome: "Cerpa Export", preco: "R$ 18", desc: "Garrafa 600ml." },
          { nome: "Kroland", preco: "R$ 18", desc: "Garrafa 600ml." },
          { nome: "Tijuca", preco: "R$ 16", desc: "Garrafa 600ml." },
          { nome: "Tijuca Silver", preco: "R$ 13", tags: ["gluten"], desc: "Garrafa 600ml. Sem glúten." },
          { nome: "Heineken", preco: "R$ 15", desc: "Long neck." }
        ]
      },
      {
        sub: "Doses",
        itens: [
          { nome: "Old Parr", preco: "R$ 26" },
          { nome: "Tequila", preco: "R$ 15" },
          { nome: "Cachaça de Jambu", preco: "R$ 10" }
        ]
      },
      {
        sub: "Bebidas",
        itens: [
          { nome: "Água", preco: "R$ 5", desc: "Normal ou com gás." },
          { nome: "Refrigerante", preco: "R$ 8", desc: "Lata." },
          { nome: "Suco", preco: "R$ 10" },
          { nome: "Energético", preco: "R$ 18" }
        ]
      }
    ]
  }
];
