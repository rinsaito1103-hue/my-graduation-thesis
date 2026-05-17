// === employees.js ===
// 従業員カードのマスターデータ
const EMPLOYEE_MASTER = [
    {
        id: "beginner",
        name: "初心者",
        cost: 2000000, // 年間人件費：200万円 [cite: 4, 6]
        rates: { S: 0.0, A: 0.0, B: 0.5, C: 1.0 }, // [cite: 4, 6]
        needIT: { S: true, A: true, B: true, C: false }, // [cite: 4, 6]
        desc: "人件費200万円。難易度B・Cの栽培に向きますが、ITシステム導入で覚醒します。[cite: 4, 6]"
    },
    {
        id: "experienced",
        name: "経験者",
        cost: 6000000, // 年間人件費：600万円 [cite: 4, 6]
        rates: { S: 0.0, A: 0.5, B: 1.0, C: 1.0 }, // [cite: 4, 6]
        needIT: { S: true, A: true, B: false, C: false }, // [cite: 4, 6]
        desc: "人件費600万円。難易度Aは通常0.5倍ですが、ITシステムがあれば1倍で栽培可能です。[cite: 4, 6]"
    },
    {
        id: "veteran",
        name: "ベテラン",
        cost: 8000000, // 年間人件費：800万円 [cite: 4, 6]
        rates: { S: 1.0, A: 1.0, B: 1.0, C: 1.0 }, // [cite: 4, 6]
        needIT: { S: false, A: false, B: false, C: false }, // [cite: 4, 6]
        desc: "人件費800万円。ITシステムに頼らず、すべての難易度の作物を100%の力で育て上げます。[cite: 4, 6]"
    }
];