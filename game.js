// === game.js ===
// --- 1. 初期データの設定 ---
let gameState = {
    playerName: "",
    year: 1,
    money: 20000000, // 初期資金2,000万円
    currentLand: null,
    // 🌟 土地1枚ごとの個別戦略（作物・出荷先・従業員配列・資材配列）を詰め込む多次元構造
    landStrategies: [] 
};

// --- 2. 画面要素（DOM）の取得 ---
const startScreen = document.getElementById("start-screen");
const setupScreen = document.getElementById("setup-screen");
const gameContainer = document.getElementById("game-container");
const resultScreen = document.getElementById("result-screen");

const nameInput = document.getElementById("name-input");
const startBtn = document.getElementById("start-game-btn");
const beginBusinessBtn = document.getElementById("begin-business-btn");
const endYearBtn = document.getElementById("end-year-btn");

const setupLandName = document.getElementById("setup-land-name");
const setupLandDesc = document.getElementById("setup-land-desc");
const landCardsContainer = document.getElementById("land-cards-container"); // 動的カード枠

const displayPlayerName = document.getElementById("display-player-name");
const landNameElement = document.getElementById("land-name");
const moneyElement = document.getElementById("money");
const currentYearElement = document.getElementById("current-year");

const finalMoneyElement = document.getElementById("final-money");
const resultRankElement = document.getElementById("result-rank");
const resultCommentElement = document.getElementById("result-comment");

// --- 🌟【コア関数】土地1枚ごとの完全独立型UIを枚数分自動生成する ---
function generateLandStrategyUI() {
    const cardCount = gameState.currentLand.totalCards; 
    const yearKey = "year" + gameState.year;
    const reqWorkers = gameState.currentLand.requiredWorkers[yearKey]; 

    landCardsContainer.innerHTML = ""; 

    for (let i = 1; i <= cardCount; i++) {
        // スタッフ選択を横並びにするために1つのコンテナにまとめる
        let workerSelectsHtml = "";
        for (let w = 1; w <= reqWorkers; w++) {
            workerSelectsHtml += `
                <select class="land-worker-select" data-land-idx="${i}">
                    <option value="beginner">スタッフ${w}:初心者(200万)</option>
                    <option value="experienced" ${w===2?'selected':''}>スタッフ${w}:経験者(600万)</option>
                    <option value="veteran" ${w===3?'selected':''}>スタッフ${w}:ベテラン(800万)</option>
                </select>
            `;
        }

        // 🌟 左右分割 ＋ 項目を横にドッキングさせて縦長を完全破壊したHTML
        const cardHtml = `
            <div class="land-strategy-card" data-idx="${i}">
                <h4>🗺️ ${i}枚目の農地 個別経営戦略</h4>
                
                <div class="land-strategy-card-left">
                    <div class="form-row">
                        <div class="form-item">
                            <label>🌾 作付する作物:</label>
                            <select class="land-crop-select">
                                <option value="cabbage">キャベツ(苗0.5万)</option>
                                <option value="corn">とうもろこし(苗1万)</option>
                                <option value="strawberry">いちご(苗1.2万)</option>
                                <option value="tomato" ${i===1?'selected':''}>トマト(苗1万)</option>
                                <option value="hakusai">仙台白菜(苗0.8万)</option>
                                <option value="artichoke">ｱｰﾃｨﾁｮｰｸ(苗1.2万)</option>
                                <option value="daikon">大根(苗1.6万)</option>
                                <option value="japanese_parsley">せり(苗0.8万)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row" style="margin-top: 8px;">
                        <div class="form-item">
                            <label>🏪 出荷・販売先:</label>
                            <select class="land-market-select">
                                <option value="JA">農協 [全作物OK]</option>
                                <option value="direct_store">直売所 [数量くじ]</option>
                                <option value="restaurant">レストラン [上限200kg]</option>
                                <option value="natural_store">自然派ストア [有機必須]</option>
                                <option value="processed_food">加工工場 [大根・ｺｰﾝ・せり]</option>
                                <option value="sixth_industry">六次産業化 [リスク有]</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="land-strategy-card-right">
                    <label>👤 配置従業員（必要人数: ${reqWorkers}名）:</label>
                    <div class="worker-row-container">
                        ${workerSelectsHtml}
                    </div>

                    <label style="margin-top: 6px;">🛠️ 導入資材（有機と化学・農薬は併用不可）:</label>
                    <div class="asset-mini-grid">
                        <label class="asset-label"><input type="checkbox" class="asset-machinery" value="machinery">高性能農機</label>
                        <label class="asset-label"><input type="checkbox" class="asset-house" value="greenhouse">ハウス</label>
                        <label class="asset-label"><input type="checkbox" class="asset-it" value="it_system">ITシステム</label>
                        <label class="asset-label"><input type="checkbox" class="asset-pesticide" value="pesticide" onchange="handleAssetExclusion(this, ${i}, 'pesticide')">農薬</label>
                        <label class="asset-label"><input type="checkbox" class="asset-fertilizer" value="fertilizer" onchange="handleAssetExclusion(this, ${i}, 'fertilizer')">化学肥料</label>
                        <label class="asset-label" style="color: #2e75b6; font-weight: bold;"><input type="checkbox" class="asset-organic" value="organic" onchange="handleAssetExclusion(this, ${i}, 'organic')">🌿有機</label>
                    </div>
                </div>
            </div>
        `;
        landCardsContainer.insertAdjacentHTML("beforeend", cardHtml);
    }
}

// 🌟【新設】動的に生成されたチェックボックスの「有機 vs 農薬・肥料」の排他制御の窓口
window.handleAssetExclusion = function(element, cardIdx, type) {
    const card = document.querySelector(`.land-strategy-card[data-idx="${cardIdx}"]`);
    const pBox = card.querySelector(".asset-pesticide");
    const fBox = card.querySelector(".asset-fertilizer");
    const oBox = card.querySelector(".asset-organic");

    if (type === "organic" && oBox.checked) {
        pBox.checked = false; fBox.checked = false;
    } else if ((type === "pesticide" || type === "fertilizer") && (pBox.checked || fBox.checked)) {
        oBox.checked = false;
    }
};

// --- 3. 画面遷移：タイトル ➔ セットアップ ---
startBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) { alert("名前を入力してください！"); return; }
    gameState.playerName = name;

    const randomIndex = Math.floor(Math.random() * LAND_MASTER.length);
    gameState.currentLand = LAND_MASTER[randomIndex];

    setupLandName.textContent = gameState.currentLand.name;
    setupLandDesc.textContent = gameState.currentLand.desc;

    // 土地カード1枚ごとの全独立設定画面を錬成する
    generateLandStrategyUI();

    startScreen.classList.add("hidden");
    setupScreen.classList.remove("hidden");
});

// --- 5. セットアップ完了 ➔ 経営開始！ ---
beginBusinessBtn.addEventListener("click", () => {
    gameState.landStrategies = [];
    let totalInvestment = gameState.currentLand.cost; // 基本の年間賃料をまず合算

    const cards = document.querySelectorAll(".land-strategy-card");
    
    // 各カード（農地1枚ずつ）の独立した設定内容を個別に回収していく
    for (let card of cards) {
        const cropId = card.querySelector(".land-crop-select").value;
        const marketId = card.querySelector(".land-market-select").value;
        
        const cropObj = CROP_MASTER.find(c => c.id === cropId);
        const marketObj = MARKET_MASTER.find(m => m.id === marketId);

        // 従業員の回収
        const workerSelects = card.querySelectorAll(".land-worker-select");
        let employees = [];
        workerSelects.forEach(sel => {
            employees.push(EMPLOYEE_MASTER.find(e => e.id === sel.value));
        });

        // チェックされた資材の回収
        let assets = [];
        const checkedBoxes = card.querySelectorAll('input[type="checkbox"]:checked');
        checkedBoxes.forEach(box => {
            assets.push(ASSET_MASTER.find(a => a.id === box.value));
        });

        // 土地1枚ごとの投資額を総計に加算
        employees.forEach(e => totalInvestment += e.cost);
        assets.forEach(a => totalInvestment += a.cost);

        // 配列へ格納
        gameState.landStrategies.push({
            crop: cropObj,
            market: marketObj,
            employees: employees,
            assets: assets
        });
    }

    if (gameState.money < totalInvestment) {
        alert("初期資金が足りません！資材や雇うスタッフのランクを下げて再調整してください。");
        return;
    }

    gameState.money -= totalInvestment;

    displayPlayerName.textContent = gameState.playerName;
    landNameElement.textContent = gameState.currentLand.name;
    moneyElement.textContent = gameState.money.toLocaleString();
    currentYearElement.textContent = gameState.year;

    alert(`【第 ${gameState.year} 年目 全農地・個別投資完了！】\n投資総額: ${(totalInvestment / 10000).toLocaleString()}万円\nメイン画面で決算を行いましょう！`);

    setupScreen.classList.add("hidden");
    gameContainer.classList.remove("hidden");
});

// --- 6. 年度終了ボタンの決算計算ロジック（カード別・完全独立計算） ---
endYearBtn.addEventListener("click", () => {
    const land = gameState.currentLand;
    const yearKey = "year" + gameState.year;
    const landPower = land.power[yearKey]; // 今年の土地パワー(2〜3)

    const globalEvent = GLOBAL_EVENTS[Math.floor(Math.random() * GLOBAL_EVENTS.length)];
    const localEvent = LOCAL_EVENTS[Math.floor(Math.random() * LOCAL_EVENTS.length)];

    let totalYearRevenue = 0;
    let reportDetailsText = "";

    // 🌟【大改造コア】それぞれの農地が「自分自身の資材フラグ」を持って個別にイベントと戦う！
    gameState.landStrategies.forEach((strat, index) => {
        const crop = strat.crop;
        const market = strat.market;
        const assets = strat.assets;

        const hasPesticide = assets.some(a => a.id === "pesticide");
        const hasFertilizer = assets.some(a => a.id === "fertilizer");
        const hasGreenhouse = assets.some(a => a.id === "greenhouse");

        let basePricePerKg = market.prices[crop.id];

        // この土地の出荷先が「取扱不可(null)」ならこの1枚の売上は0円
        if (basePricePerKg === null) {
            reportDetailsText += `・${index + 1}枚目【${crop.name} ➔ ${market.name}】: 出荷不可（売上 0 円）\n`;
            return;
        }

        // 全体イベントによる価格変動
        let finalPricePerKg = basePricePerKg;
        if (globalEvent.id === "boom_exotic" && crop.id === "artichoke") finalPricePerKg *= 2;
        if (globalEvent.id === "boom_traditional" && crop.id === "hakusai") finalPricePerKg *= 2;
        if (globalEvent.id === "rival" && market.id === "sixth_industry") finalPricePerKg *= 0.5;
        
        if (globalEvent.id === "bumper_crop" && ["cabbage", "corn", "strawberry", "tomato", "daikon"].includes(crop.id)) finalPricePerKg *= 0.5;
        if (globalEvent.id === "poor_crop" && ["cabbage", "corn", "strawberry", "tomato", "hakusai", "artichoke"].includes(crop.id)) finalPricePerKg *= 2;

        // 収穫量の計算（土地の標準収量 × 土地パワー）
        let totalYieldKg = crop.yieldPerUnit * landPower;
        let yieldRate = 1.0;

        // 局地イベントの個別判定（ハウスや農薬がある土地だけがピンポイントで救われる！）
        if (localEvent.id === "pest") {
            if (hasPesticide) {
                // このカードだけ防御成功
            } else if (["cabbage", "corn", "strawberry", "hakusai", "artichoke", "japanese_parsley"].includes(crop.id)) {
                yieldRate *= 0.5;
            }
        }
        else if (localEvent.id === "disease") {
            if (["cabbage", "corn", "strawberry", "japanese_parsley"].includes(crop.id)) yieldRate *= 0.5;
            if (["hakusai", "artichoke", "daikon", "tomato"].includes(crop.id)) yieldRate *= 0;
        }
        else if (localEvent.id === "heavy_rain") {
            if (hasGreenhouse) {
                // このカードだけ防御成功
            } else {
                if (["cabbage", "corn", "daikon", "hakusai", "japanese_parsley"].includes(crop.id)) yieldRate *= 0.5;
                if (["strawberry", "tomato", "artichoke"].includes(crop.id)) yieldRate *= 0;
            }
        }
        else if (localEvent.id === "bad_growth") {
            if (hasFertilizer) {
                // このカードだけ防御成功
            } else if (["cabbage", "tomato", "hakusai", "daikon", "japanese_parsley"].includes(crop.id)) {
                yieldRate *= 0.5;
            }
        }
        else if (localEvent.id === "animal_damage") {
            if (hasGreenhouse) {
                // ハウス破壊トリガー（この土地の設定からハウスを消す）
                strat.assets = assets.filter(a => a.id !== "greenhouse");
            }
            yieldRate *= 0;
        }
        else if (localEvent.id === "good_weather") {
            yieldRate *= 2;
        }

        totalYieldKg *= yieldRate;

        // 個別販売上限の適用
        if (market.id === "restaurant" && totalYieldKg > 200) totalYieldKg = 200;
        if (market.id === "natural_store" && totalYieldKg > 250) totalYieldKg = 250;

        let cropRevenue = Math.round(totalYieldKg * finalPricePerKg);
        totalYearRevenue += cropRevenue;

        // 内訳テキストの生成（どの土地に何を植えて、どの資材で守ったかが一目瞭然！）
        const shieldStatus = (localEvent.id==='pest'&&hasPesticide) || (localEvent.id==='heavy_rain'&&hasGreenhouse) || (localEvent.id==='bad_growth'&&hasFertilizer) ? " 🛡️防御成功！" : "";
        reportDetailsText += `・${index + 1}枚目【${crop.name}➔${market.name}】 収量: ${totalYieldKg.toLocaleString()}kg${shieldStatus} / 売上: ＋${cropRevenue.toLocaleString()}円\n`;
    });

    gameState.money += totalYearRevenue;

    // 決算アラート
    alert(
        `📊 【第 ${gameState.year} 年度 完全個別ポートフォリオ 決算報告】\n` +
        `----------------------------------------\n` +
        `🎲 全体イベント: 【${globalEvent.name}】(${globalEvent.desc})\n` +
        `🎲 局地イベント: 【${localEvent.name}】(${localEvent.desc})\n` +
        `----------------------------------------\n` +
        `【各農地ごとの個別経営リザルト】\n` +
        reportDetailsText +
        `----------------------------------------\n` +
        `💵 今年の総売上高 : ＋ ${totalYearRevenue.toLocaleString()} 円！\n` +
        `💰 現在の総経営資金 : ${gameState.money.toLocaleString()} 円`
    );

    advanceToNextYear();
});

// --- 7. 年度進行 ---
function advanceToNextYear() {
    if (gameState.year >= 3) {
        showFinalResult();
        return;
    }
    gameState.year += 1;
    currentYearElement.textContent = gameState.year;
    moneyElement.textContent = gameState.money.toLocaleString();
    
    alert(`第 ${gameState.year} 年目の作付・投資フェーズへ移行します。土地ごとの個別戦略を再度練り直してください。`);
    
    // 次のターンの必要人数に合わせて、フォームを枚数分まるごと再レンダリング！
    generateLandStrategyUI();

    gameContainer.classList.add("hidden");
    setupScreen.classList.remove("hidden");
}

// 最終リザルト表示
function showFinalResult() {
    gameContainer.classList.add("hidden");
    resultScreen.classList.remove("hidden");
    finalMoneyElement.textContent = gameState.money.toLocaleString();

    if (gameState.money >= 25000000) {
        resultRankElement.textContent = "🏆 ランクＳ：伝説のメガ農家";
        resultCommentElement.textContent = `素晴らしい！すべての農地に最適な人材と資材を個別配分し、リスクを完璧にヘッジしました。経営コンサルタント並みの素晴らしい采配です！`;
    } else if (gameState.money >= 20000000) {
        resultRankElement.textContent = "👍 ランクＡ：優秀な黒字経営者";
        resultCommentElement.textContent = `見事な経営です！土地ごとの特性を活かして利益を堅実に残しました。立派な多角化農業経営者です。`;
    } else {
        resultRankElement.textContent = "📉 ランクＣ：破産寸前・赤字経営";
        resultCommentElement.textContent = `残念…！リソースを分散させすぎて、特定の土地の投資（人件費・資材費）が回収できませんでした。次はコスト配分を意識してみましょう。`;
    }
}