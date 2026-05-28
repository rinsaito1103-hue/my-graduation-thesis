// === crops.js ===
// 【PDFパラメーター完全対応】農作物カード一覧（全8種類）
const CROP_MASTER = [
    {
        id: "cabbage",
        name: "キャベツ",
        difficulty: "C",      // 難易度C
        yieldPerUnit: 300,   // 収量: 300kg
        unitPrice: 30000,    // 販売単価: 3万円
        costPerUnit: 5000,    // 苗代: 0.5万円
        desc: "難易度Cの育てやすい作物。初期コストが低く、手堅く資金を回すのに適しています。"
    },
    {
        id: "corn",
        name: "とうもろこし",
        difficulty: "B",      // 難易度B
        yieldPerUnit: 480,   // 収量: 480kg
        unitPrice: 50000,    // 販売単価: 5万円
        costPerUnit: 50000,   // 苗代: 5万円
        desc: "難易度Bの標準的な作物。キャベツに比べて苗代がやや高い分、イベントでの変動が期待されます。"
    },
    {
        id: "strawberry",
        name: "いちご",
        difficulty: "A",      // 難易度A
        yieldPerUnit: 360,   // 収量: 360kg
        unitPrice: 50000,    // 販売単価: 5万円
        costPerUnit: 70000,   // 苗代: 7万円
        desc: "難易度Aの高収益作物。収穫量が360kgと非常に多く、経験者以上のスタッフで真価を発揮します。"
    },
    {
        id: "tomato",
        name: "トマト",
        difficulty: "A",      // 難易度A
        yieldPerUnit: 240,   // 収量: 240kg
        unitPrice: 70000,    // 販売単価: 7万円
        costPerUnit: 50000,   // 苗代: 5万円
        desc: "難易度Aの主力作物。販売単価が7万円と高く、ハウス栽培や優良農地との相性が抜群です。"
    },
    {
        id: "hakusai",
        name: "仙台白菜",
        difficulty: "S",      // 難易度S
        yieldPerUnit: 240,   // 収量: 240kg
        unitPrice: 50000,    // 販売単価: 5万円
        costPerUnit: 80000,    // 苗代: 8万円
        desc: "難易度Sのミドルリスク作物。初心者だと収量が落ちる（0.5倍）ため、人員配置が鍵となります。"
    },
    {
        id: "artichoke",
        name: "アーティチョーク",
        difficulty: "S",      // 最高難易度S
        yieldPerUnit: 180,   // 収量: 180kg
        unitPrice: 80000,    // 販売単価: 8万円
        costPerUnit: 100000,   // 苗代: 10万円
        desc: "難易度Sの超希少作物。ベテランか、ITシステムでの管理を行わないと全く収穫できません。"
    },
    {
        id: "daikon",
        name: "大根",
        difficulty: "B",      // 難易度B（PDF表の「工業」列に対応）
        yieldPerUnit: 300,   // 収量: 300kg
        unitPrice: 100000,   // 販売単価: 10万円（最高額）
        costPerUnit: 30000,   // 苗代: 3万円
        desc: "難易度Bの特殊作物。栽培は極めて難しいですが、10万円という最高の販売価格を誇ります。"
    },
    {
        id: "japanese_parsley",
        name: "せり",
        difficulty: "A",      // 難易度A（PDF表の「ブランド」列に対応）
        yieldPerUnit: 240,   // 収量: 240kg
        unitPrice: 30000,    // 販売単価: 3万円
        costPerUnit: 70000,    // 苗代: 7万円
        desc: "難易度Aの付加価値作物。収量は少なめですが、特定の販売先やイベントで価格が跳ね上がります。"
    }
];