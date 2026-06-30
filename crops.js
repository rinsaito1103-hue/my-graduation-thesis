// === crops.js ===
// 【PDFパラメーター完全対応】農作物カード一覧（全8種類）
const CROP_MASTER = [
    {
        id: "cabbage",
        name: "キャベツ",
        family: "aburana",    // アブラナ科
        difficulty: "C",
        yieldPerUnit: 300,
        unitPrice: 30000,
        costPerUnit: 5000,
        desc: "難易度Cの育てやすい作物。初期コストが低く、手堅く資金を回すのに適しています。"
    },
    {
        id: "corn",
        name: "とうもろこし",
        family: "ine",        // イネ科
        difficulty: "B",
        yieldPerUnit: 480,
        unitPrice: 50000,
        costPerUnit: 50000,
        desc: "難易度Bの標準的な作物。キャベツに比べて苗代がやや高い分、イベントでの変動が期待されます。"
    },
    {
        id: "strawberry",
        name: "いちご",
        family: "bara",       // バラ科
        difficulty: "A",
        yieldPerUnit: 360,
        unitPrice: 50000,
        costPerUnit: 70000,
        desc: "難易度Aの高収益作物。収穫量が360kgと非常に多く、経験者以上のスタッフで真価を発揮します。"
    },
    {
        id: "tomato",
        name: "トマト",
        family: "nasu",       // ナス科
        difficulty: "A",
        yieldPerUnit: 240,
        unitPrice: 70000,
        costPerUnit: 50000,
        desc: "難易度Aの主力作物。販売単価が7万円と高く、ハウス栽培や優良農地との相性が抜群です。"
    },
    {
        id: "hakusai",
        name: "仙台白菜",
        family: "aburana",    // アブラナ科（キャベツや大根と被る罠）
        difficulty: "S",
        yieldPerUnit: 240,
        unitPrice: 50000,
        costPerUnit: 80000,
        desc: "難易度Sのミドルリスク作物。初心者だと収量が落ちるため、人員配置が鍵となります。"
    },
    {
        id: "artichoke",
        name: "アーティチョーク",
        family: "kiku",       // キク科
        difficulty: "S",
        yieldPerUnit: 180,
        unitPrice: 80000,
        costPerUnit: 100000,
        desc: "難易度Sの超希少作物。ベテランか、ITシステムでの管理を行わないと全く収穫できません。"
    },
    {
        id: "daikon",
        name: "大根",
        family: "aburana",    // アブラナ科
        difficulty: "B",
        yieldPerUnit: 300,
        unitPrice: 100000,
        costPerUnit: 30000,
        desc: "難易度Bの特殊作物。栽培は極めて難しいですが、10万円という最高の販売価格を誇ります。"
    },
    {
        id: "japanese_parsley",
        name: "せり",
        family: "seri",       // セリ科
        difficulty: "A",
        yieldPerUnit: 240,
        unitPrice: 30000,
        costPerUnit: 70000,
        desc: "難易度Aの付加価値作物。特定の販売先やイベントで価格が跳ね上がります。"
    }
];