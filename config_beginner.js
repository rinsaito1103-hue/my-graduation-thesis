// === config_beginner.js ===
// 初心者モードの設定値（パラメーター）一覧

const CONFIG_BEGINNER = {
    id: "beginner",
    name: "初心者用",
    
    // 資金設定
    startMoney: 150000000, // 初期資金: 1.5億円
    
    // 🌟 今後、難易度調整で使いやすいパラメーターの予備
    // 例：初心者は収穫量が常に1.2倍になるボーナス、など
    yieldBonus: 1.0,
    
    // 例：初心者は特定の災害を無効化するフラグ、など
    disableAnimalDamage: false 
};