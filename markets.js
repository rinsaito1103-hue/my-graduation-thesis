// === markets.js ===
// 出荷先ごとの1kgあたり買取価格（円）マトリクス
const MARKET_MASTER = [
    {
        id: "JA",
        name: "農協",
        prices: {
            cabbage: 5000, corn: 12000, strawberry: 10000, tomato: 8000,
            hakusai: 12000, artichoke: 16000, daikon: 8000, japanese_parsley: 10000
        },
        desc: "条件なく、すべての農作物を売ることができます。"
    },
    {
        id: "direct_store",
        name: "直売所",
        prices: {
            cabbage: 10000, corn: null, strawberry: 12000, tomato: 10000,
            hakusai: 18000, artichoke: null, daikon: null, japanese_parsley: 20000
        },
        desc: "くじで販売量が決定（一部作物は販売不可）。"
    },
    {
        id: "restaurant",
        name: "レストラン契約",
        prices: {
            cabbage: null, corn: 50000, strawberry: null, tomato: 16000,
            hakusai: 40000, artichoke: 50000, daikon: null, japanese_parsley: 40000
        },
        desc: "販売上限は200kg。"
    },
    {
        id: "natural_store",
        name: "自然派ストア",
        prices: {
            cabbage: 20000, corn: 30000, strawberry: 20000, tomato: 18000,
            hakusai: 60000, artichoke: 80000, daikon: 15000, japanese_parsley: 30000
        },
        desc: "有機カードがついたものしか売れない。販売上限は250kg。"
    },
    {
        id: "processed_food",
        name: "加工食品工場",
        prices: {
            cabbage: null, corn: 10000, strawberry: null, tomato: null,
            hakusai: null, artichoke: null, daikon: 30000, japanese_parsley: 5000
        },
        desc: "加工食品を高値で買い取ります。"
    },
    {
        id: "sixth_industry",
        name: "六次産業化",
        prices: {
            cabbage: 25000, corn: null, strawberry: 30000, tomato: 40000,
            hakusai: null, artichoke: null, daikon: 35000, japanese_parsley: 50000
        },
        desc: "2年目からしか使えない。商標登録カードを使われると販売量がゼロになる。"
    }
];