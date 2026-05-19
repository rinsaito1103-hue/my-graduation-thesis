// === employees.js ===
// 従業員カードのマスターデータ（収穫量倍率・ITシステム連動定義）
const EMPLOYEE_MASTER = [
    {
        id: "beginner",
        name: "初心者",
        cost: 2000000, // 年間人件費：200万円
        rates: { S: 0.0, A: 0.0, B: 0.5, C: 1.0 }, // 栽培難易度ごとの基礎収穫量倍率
        needIT: { S: true, A: true, B: true, C: false }, // ITシステムがないと制限がかかるフラグ
        desc: "人件費200万円。難易度B・Cの栽培に向きますが、ITシステム導入で覚醒します。"
    },
    {
        id: "experienced",
        name: "経験者",
        cost: 6000000, // 年間人件費：600万円
        rates: { S: 0.0, A: 0.5, B: 1.0, C: 1.0 }, // 難易度Aは通常0.5倍
        needIT: { S: true, A: true, B: false, C: false }, // 難易度A・SはITシステムでカバー可能
        desc: "人件費600万円。難易度Aは通常0.5倍ですが、ITシステムがあれば1倍で栽培可能です。"
    },
    {
        id: "veteran",
        name: "ベテラン",
        cost: 8000000, // 年間人件費：800万円
        rates: { S: 1.0, A: 1.0, B: 1.0, C: 1.0 }, // すべての難易度を最初から100%で栽培可能
        needIT: { S: false, A: false, B: false, C: false }, // ITシステムは一切不要
        desc: "人件費800万円。ITシステムに頼らず、すべての難易度の作物を100%の力で育て上げます。"
    }
];