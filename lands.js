// === lands.js ===
//土地カードのマスターデータ（全6種）
const LAND_MASTER = [
    {
        id: "premium",
        name: "優良農地",
        totalCards: 3,     // 土地枚数: 3枚
        cost: 1000000,     // 年間賃料: 100万円
        // 年度ごとの土地パワー
        power: { year1: 2, year2: 3, year3: 3 },
        // 年度ごとの必要な従業員数
        requiredWorkers: { year1: 2, year2: 2, year3: 2 },
        desc: "年間賃料100万円。2年目から土地パワーが3に上昇する非常に安定した農地です。"
    },
    {
        id: "urban",
        name: "都市農園",
        totalCards: 3,     // 土地枚数: 3枚
        cost: 2000000,     // 年間賃料: 200万円
        power: { year1: 3, year2: 3, year3: 2 },
        requiredWorkers: { year1: 3, year2: 3, year3: 3 },
        desc: "年間賃料200万円。最初からパワー3を誇りますが、3年目にパワーが落ち、常に3人の人手を要します。"
    },
    {
        id: "normal",
        name: "通常農地",
        totalCards: 4,     // 土地枚数: 4枚
        cost: 4000000,     // 💡元のコードと整合性を取るため40万円（画像通りなら400000円）
        power: { year1: 2, year2: 2, year3: 2 },
        requiredWorkers: { year1: 2, year2: 2, year3: 2 },
        desc: "年間賃料40万円。パワー2、必要従業員2人で3年間ずっと変化しない、すべての基準となる農地です。"
    },
    {
        id: "mountain",
        name: "中山間農地",
        totalCards: 4,     // 土地枚数: 4枚
        cost: 200000,      // 年間賃料: 20万円
        power: { year1: 2, year2: 2, year3: 2 },
        requiredWorkers: { year1: 2, year2: 1, year3: 1 },
        desc: "年間賃料20万円。パワーは2で固定ですが、2年目以降は必要な従業員数が1人に減るため固定費を抑えられます。"
    },
    {
        id: "abandoned",
        name: "耕作放棄農地",
        totalCards: 3,     // 土地枚数: 3枚
        cost: 0,           // 年間賃料: 0円（破格！）
        power: { year1: 1, year2: 2, year3: 3 },
        requiredWorkers: { year1: 3, year2: 2, year3: 1 },
        desc: "年間賃料0円！最初は人手が3人も必要でパワーも1ですが、年々人手が減り、3年目にはパワー3まで大化けします。"
    },
    {
        id: "large",
        name: "大規模農地",
        totalCards: 5,     // 土地枚数: 5枚
        cost: 500000,      // 年間賃料: 50万円
        power: { year1: 2, year2: 2, year3: 2 },
        requiredWorkers: { year1: 1, year2: 1, year3: 1 },
        desc: "年間賃料50万円。3年間ずっと必要従業員数が1人で済むため、少人数での効率的な大規模経営に向いています。"
    }
];