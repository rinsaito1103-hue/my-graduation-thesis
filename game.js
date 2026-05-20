// === game.js ===
// --- 1. 初期データの設定 ---
let gameState = {
    playerName: "",
    year: 1,
    money: 100000000,      // 初期資金1億円
    cumExpenses: 0,       // 累計費用
    cumRevenue: 0,        // 累計収益
    currentLand: null,
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
const landCardsContainer = document.getElementById("land-cards-container");

const displayPlayerName = document.getElementById("display-player-name");
const landNameElement = document.getElementById("land-name");
const moneyElement = document.getElementById("money");
const currentYearElement = document.getElementById("current-year");

const finalMoneyElement = document.getElementById("final-money");
const resultRankElement = document.getElementById("result-rank");
const resultCommentElement = document.getElementById("result-comment");

const setupYearDisplay = document.getElementById("setup-year-display");
const sumCurrentMoney = document.getElementById("sum-current-money");
const sumCumExpense = document.getElementById("sum-cum-expense");
const sumCumRevenue = document.getElementById("sum-cum-revenue");

// --- 3. UIの動的生成ロジック（前年の記憶データを初期値として100%引き継ぐ） ---
function generateLandStrategyUI() {
    const cardCount = gameState.currentLand.totalCards; 
    const yearKey = "year" + gameState.year;
    const reqWorkers = gameState.currentLand.requiredWorkers[yearKey]; 

    landCardsContainer.innerHTML = ""; 

    for (let i = 1; i <= cardCount; i++) {
        // 💡 配列のインデックス（0から始まる）に合わせて前年の記憶データを取得
        let saved = gameState.landStrategies[i - 1] || null;

        // 1. 従業員セレクトの初期値を判定（記憶があればそれを再現、なければ初期値）
        let workerSelectsHtml = "";
        for (let w = 1; w <= reqWorkers; w++) {
            let savedWorkerId = (saved && saved.employeeIds && saved.employeeIds[w - 1]) ? saved.employeeIds[w - 1] : "beginner";
            
            // 1年目の初期配置ルール（2人目は経験者、3人目はベテラン）も記憶がなければ維持
            if (!saved) {
                if (w === 2) savedWorkerId = "experienced";
                if (w === 3) savedWorkerId = "veteran";
            }

            workerSelectsHtml += `
                <select class="land-worker-select" data-land-idx="${i}" onchange="calculateLiveCardCost(${i})">
                    <option value="beginner" ${savedWorkerId === 'beginner' ? 'selected' : ''}>スタッフ${w}:初心者 (200万)</option>
                    <option value="experienced" ${savedWorkerId === 'experienced' ? 'selected' : ''}>スタッフ${w}:経験者 (600万)</option>
                    <option value="veteran" ${savedWorkerId === 'veteran' ? 'selected' : ''}>スタッフ${w}:ベテラン (800万)</option>
                </select>
            `;
        }

        // 2. 作物と販売先の記憶状態を事前判定（記憶がなければ初期値を割り当て）
        const savedCropId = saved ? saved.cropId : (i === 1 ? "tomato" : "hakusai");
        const savedMarketId = saved ? saved.marketId : "JA";

        // 3. 各種資材のチェック記憶状態を事前判定
        const hasMachinery = saved && saved.assetIds ? saved.assetIds.includes("machinery") : false;
        const hasGreenhouse = saved && saved.assetIds ? saved.assetIds.includes("greenhouse") : false;
        const hasITSystem = saved && saved.assetIds ? saved.assetIds.includes("it_system") : false;
        const hasPesticide = saved && saved.assetIds ? saved.assetIds.includes("pesticide") : false;
        const hasFertilizer = saved && saved.assetIds ? saved.assetIds.includes("fertilizer") : false;
        const hasOrganic = saved && saved.assetIds ? saved.assetIds.includes("organic") : false;

        const cardHtml = `
            <div class="land-strategy-card" data-idx="${i}">
                <h4>🗺️ ${i}枚目の農地 個別経営戦略</h4>
                
                <div class="card-inner-flex">
                    <div class="land-strategy-card-left">
                        <label>🌾 作付する作物:</label>
                        <select class="land-crop-select" onchange="calculateLiveCardCost(${i})">
                            <option value="hakusai" ${savedCropId === 'hakusai' ? 'selected' : ''}>🥬 S:仙台白菜 (8,000円)</option>
                            <option value="artichoke" ${savedCropId === 'artichoke' ? 'selected' : ''}>🌱 S:アーティチョーク (12,000円)</option>
                            <option value="tomato" ${savedCropId === 'tomato' ? 'selected' : ''}>🍅 A:トマト (10,000円)</option>
                            <option value="strawberry" ${savedCropId === 'strawberry' ? 'selected' : ''}>🍓 A:いちご (12,000円)</option>
                            <option value="japanese_parsley" ${savedCropId === 'japanese_parsley' ? 'selected' : ''}>🌿 A:せり (8,000円)</option>
                            <option value="corn" ${savedCropId === 'corn' ? 'selected' : ''}>🌽 B:とうもろこし (10,000円)</option>
                            <option value="daikon" ${savedCropId === 'daikon' ? 'selected' : ''}>🥕 B:大根 (16,000円)</option>
                            <option value="cabbage" ${savedCropId === 'cabbage' ? 'selected' : ''}>🥬 C:キャベツ (5,000円)</option>
                        </select>

                        <label style="margin-top: 5px;">🏪 出荷・販売先:</label>
                        <select class="land-market-select" onchange="calculateLiveCardCost(${i})">
                            <option value="JA" ${savedMarketId === 'JA' ? 'selected' : ''}>農協 [全作物OK]</option>
                            <option value="direct_store" ${savedMarketId === 'direct_store' ? 'selected' : ''}>直売所 [数量くじ]</option>
                            <option value="restaurant" ${savedMarketId === 'restaurant' ? 'selected' : ''}>レストラン [上限200kg]</option>
                            <option value="natural_store" ${savedMarketId === 'natural_store' ? 'selected' : ''}>自然派ストア [有機必須]</option>
                            <option value="processed_food" ${savedMarketId === 'processed_food' ? 'selected' : ''}>加工工場 [大根・ｺｰﾝ・せり]</option>
                            <option value="sixth_industry" ${savedMarketId === 'sixth_industry' ? 'selected' : ''}>六次産業化 [リスク有]</option>
                        </select>
                    </div>

                    <div class="land-strategy-card-right">
                        <label>👤 配置従業員（必要人数: ${reqWorkers}名）:</label>
                        <div class="worker-row-container">
                            ${workerSelectsHtml}
                        </div>

                        <label style="margin-top: 2px;">🛠️ 農業資材・施設（最大3つまで）:</label>
                        <div class="asset-mini-grid">
                            <label class="asset-label"><input type="checkbox" class="asset-machinery" ${hasMachinery ? "checked" : ""} value="machinery" onchange="handleAssetExclusion(this, ${i}, 'machinery')">🚜高性能農機 (＋150万)</label>
                            <label class="asset-label"><input type="checkbox" class="asset-house" ${hasGreenhouse ? "checked" : ""} value="greenhouse" onchange="handleAssetExclusion(this, ${i}, 'greenhouse')">🏠ハウス施設 (＋400万)</label>
                            <label class="asset-label"><input type="checkbox" class="asset-it" ${hasITSystem ? "checked" : ""} value="it_system" onchange="handleAssetExclusion(this, ${i}, 'it_system')">💻ITシステム (＋200万)</label>
                            <label class="asset-label"><input type="checkbox" class="asset-pesticide" ${hasPesticide ? "checked" : ""} value="pesticide" onchange="handleAssetExclusion(this, ${i}, 'pesticide')">🧪特定農薬 (＋50万)</label>
                            <label class="asset-label"><input type="checkbox" class="asset-fertilizer" ${hasFertilizer ? "checked" : ""} value="fertilizer" onchange="handleAssetExclusion(this, ${i}, 'fertilizer')">🧪化学肥料 (＋50万)</label>
                            <label class="asset-label"><input type="checkbox" class="asset-organic" ${hasOrganic ? "checked" : ""} value="organic" onchange="handleAssetExclusion(this, ${i}, 'organic')">🌿 有機栽培資材 (＋100万)</label>
                        </div>
                    </div>
                </div>

                <table class="live-simulation-table" id="simulation-table-${i}">
                    </table>

                <div class="land-cost-counter" id="card-cost-counter-${i}">
                    💰 この農地の投資小計: 0 円
                </div>
            </div>
        `;
        landCardsContainer.insertAdjacentHTML("beforeend", cardHtml);
        calculateLiveCardCost(i); 
    }
}

// 💡 リアルタイム営農シミュレーター＆コスト合算システム（エラー完全解消版）
window.calculateLiveCardCost = function(cardOrIdx) {
    if (!cardOrIdx) return;

    let card;
    if (typeof cardOrIdx === "object") {
        card = cardOrIdx;
    } else {
        card = document.querySelector(`.land-strategy-card[data-idx="${cardOrIdx}"]`);
    }
    if (!card) return;

    const cropId = card.querySelector(".land-crop-select").value;
    const landCostBase = gameState.currentLand ? gameState.currentLand.cost : 0;

    const crop = CROP_MASTER.find(c => c.id === cropId);
    let baseYieldPerUnit = crop ? crop.yieldPerUnit : 0;

    let landPower = 1.0;
    if (gameState.currentLand && gameState.currentLand.id === "suwa") landPower = 1.2;
    if (gameState.currentLand && gameState.currentLand.id === "matsumoto") landPower = 1.5;

    const marketId = card.querySelector(".land-market-select").value;
    let basePricePerKg = 0; 
    let marketName = "農協";
    let saleLimitText = "上限なし";

    const marketObj = MARKET_MASTER.find(m => m.id === marketId);
    if (marketObj) {
        marketName = marketObj.name;
        basePricePerKg = marketObj.prices[cropId] || 0; 
    }

    if (marketId === "restaurant") saleLimitText = "200 kg";
    if (marketId === "natural_store") saleLimitText = "250 kg";

    if (basePricePerKg === 0 || basePricePerKg === null) {
        basePricePerKg = 0;
        saleLimitText = "出荷不可";
    }

    let laborCost = 0;
    let workerCount = 0;
    let techShortage = false; 
    let totalWorkerYieldMultiplier = 0; 

    let cropRankKey = "C"; 
    if (cropId === "corn" || cropId === "daikon") cropRankKey = "B";
    if (cropId === "tomato" || cropId === "strawberry" || cropId === "japanese_parsley") cropRankKey = "A";
    if (cropId === "hakusai" || cropId === "artichoke") cropRankKey = "S";

    const hasITSystem = card.querySelector(".asset-it")?.checked;

    const workerSelects = card.querySelectorAll(".land-worker-select");
    workerSelects.forEach(sel => {
        workerCount++;
        const empData = EMPLOYEE_MASTER.find(e => e.id === sel.value);
        if (empData) {
            laborCost += empData.cost; 
            let workerRate = empData.rates[cropRankKey];

            if (hasITSystem && empData.needIT[cropRankKey]) {
                workerRate = 1.0;
            }

            if (workerRate === 0.0) {
                techShortage = true;
            }

            totalWorkerYieldMultiplier += workerRate;
        }
    });

    if (techShortage) {
        totalWorkerYieldMultiplier = 0;
    }

    let avgWorkerMultiplier = workerCount > 0 ? (totalWorkerYieldMultiplier / workerCount) : 0;

    let planYield = baseYieldPerUnit * landPower * avgWorkerMultiplier; 
    
    let techStatusText = "<span style='color:#16a34a; font-weight:bold;'>合格</span>";
    if (techShortage) {
        planYield = 0;
        techStatusText = "<span style='color:#dc2626; font-weight:bold;'>⚠️技術不足・出荷不可</span>";
    }

    let actualSaleQty = planYield;
    if (marketId === "restaurant" && actualSaleQty > 200) actualSaleQty = 200;
    if (marketId === "natural_store" && actualSaleQty > 250) actualSaleQty = 250;

    let estimatedRevenue = Math.round(actualSaleQty * basePricePerKg); 

    const pBox = card.querySelector(".asset-pesticide");
    const fBox = card.querySelector(".asset-fertilizer");
    const oBox = card.querySelector(".asset-organic");
    const isOrganicValid = oBox?.checked && !pBox?.checked && !fBox?.checked;

    if (!isOrganicValid && marketId === "natural_store") {
        card.querySelector(".land-market-select").value = "JA";
        return calculateLiveCardCost(card); 
    }

    let seedCost = 0;
    if (cropId === "cabbage") seedCost = 5000;
    else if (cropId === "corn") seedCost = 10000;
    else if (cropId === "strawberry") seedCost = 12000;
    else if (cropId === "tomato") seedCost = 10000;
    else if (cropId === "hakusai") seedCost = 8000;
    else if (cropId === "artichoke") seedCost = 12000;
    else if (cropId === "daikon") seedCost = 16000;
    else if (cropId === "japanese_parsley") seedCost = 8000;

    let assetCost = 0;
    if (card.querySelector(".asset-machinery")?.checked) assetCost += 1500000;
    if (card.querySelector(".asset-house")?.checked) assetCost += 4000000;
    if (card.querySelector(".asset-it")?.checked) assetCost += 2000000;
    if (card.querySelector(".asset-pesticide")?.checked) assetCost += 500000;
    if (card.querySelector(".asset-fertilizer")?.checked) assetCost += 500000;
    if (card.querySelector(".asset-organic")?.checked) assetCost += 1000000;

    // 💡 投資小計に土地代を合算する（重複エラーが出ないようにここで1回だけ宣言）
    let cardTotalInvestment = seedCost + laborCost + assetCost + landCostBase;
    
    let estimatedProfit = Math.round(estimatedRevenue - cardTotalInvestment); 

    const idx = card.getAttribute("data-idx");
    const simTable = document.getElementById(`simulation-table-${idx}`);
    if (simTable) {
        simTable.innerHTML = `
            <thead>
                <tr>
                    <th style="width: 55%;">勘定科目 / 項目</th>
                    <th style="width: 15%; text-align:center;">単位</th>
                    <th style="width: 30%; text-align:right;">内訳データ</th>
                </tr>
            </thead>
            <tbody>
                <tr class="row-status"><td>従業員技術判定</td><td class="text-center">-</td><td class="text-right">${techStatusText}</td></tr>
                
                <tr class="row-revenue-header"><td>売上</td><td class="text-center">円</td><td class="text-right">${estimatedRevenue.toLocaleString()}</td></tr>
                <tr><td>　販売価格 (単価)</td><td class="text-center">円</td><td class="text-right">${basePricePerKg.toLocaleString()}</td></tr>
                <tr><td>　計画収穫量 (標準収量×土地パワー×従業員制限)</td><td class="text-center">kg</td><td class="text-right">${Math.round(planYield)}</td></tr>
                <tr><td>　　土地パワー</td><td class="text-center">倍</td><td class="text-right">${landPower}</td></tr>
                <tr><td>　　標準収穫量ベース</td><td class="text-center">kg</td><td class="text-right">${baseYieldPerUnit}</td></tr>
                <tr><td>　　従業員の収穫可能量制限</td><td class="text-center">倍</td><td class="text-right">${avgWorkerMultiplier.toFixed(1)} 倍</td></tr>
                <tr><td>　販売上限制限</td><td class="text-center">kg</td><td class="text-right">${saleLimitText}</td></tr>

                <tr class="row-expense-header"><td>投資小計 (費用)</td><td class="text-center">円</td><td class="text-right">${cardTotalInvestment.toLocaleString()}</td></tr>
                <tr><td>　土地の貸借料</td><td class="text-center">円</td><td class="text-right">${landCostBase.toLocaleString()}</td></tr>
                <tr><td>　種苗・苗木費</td><td class="text-center">円</td><td class="text-right">${seedCost.toLocaleString()}</td></tr>
                <tr><td>　従業員人件費</td><td class="text-center">円</td><td class="text-right">${laborCost.toLocaleString()}</td></tr>
                <tr><td>　設備・IT投資費</td><td class="text-center">円</td><td class="text-right">${assetCost.toLocaleString()}</td></tr>

                <tr class="row-profit-header"><td>見込利益 (売上－投資小計)</td><td class="text-center">円</td><td class="text-right" style="color: ${estimatedProfit >= 0 ? '#16a34a' : '#dc2626'}; font-weight:bold;">${estimatedProfit.toLocaleString()}</td></tr>
            </tbody>
        `;
    }

    const counterDiv = document.getElementById(`card-cost-counter-${idx}`);
    if (counterDiv) {
        counterDiv.textContent = `💰 この農地の投資小計: ${(cardTotalInvestment).toLocaleString()} 円`;
    }

    if (typeof updateSetupFinancialBanner === "function") {
        updateSetupFinancialBanner();
    }
};

// 🌟【新設】排他制御 ＆「最大3つまで」の上限制限バリデーションの完全連動
window.handleAssetExclusion = function(element, cardIdx, type) {
    const card = document.querySelector(`.land-strategy-card[data-idx="${cardIdx}"]`);
    if (!card) return;

    const pBox = card.querySelector(".asset-pesticide");
    const fBox = card.querySelector(".asset-fertilizer");
    const oBox = card.querySelector(".asset-organic");

    // 1. 【制限ルール】最大3つまでのチェック制限バリデーションを先に判定
    const allChecked = card.querySelectorAll('input[type="checkbox"]:checked');
    if (allChecked.length > 3) {
        alert("🚨 【資材制限ルール】\n1つの農地に導入できる農業資材・施設は「最大3つまで」です！");
        element.checked = false; // 4つ目に選んだチェックをその場で強制解除
        return; // 処理をここで終了して計算に進ませない
    }

    // 2. 【排他ルール】有機栽培と化学系の排他制御ロジック
    if (type === "organic" && oBox.checked) {
        pBox.checked = false; 
        fBox.checked = false;
    } else if ((type === "pesticide" || type === "fertilizer") && (pBox.checked || fBox.checked)) {
        oBox.checked = false;
    }

    // 💡【新設】有機栽培資材がON、かつ農薬・肥料がOFFの時だけ「自然派ストア」を解放する制御
    const marketSel = card.querySelector(".land-market-select");
    if (marketSel) {
        const naturalStoreOption = marketSel.querySelector('option[value="natural_store"]');
        if (naturalStoreOption) {
            // 🌟 条件：有機栽培資材(oBox)にチェックが入っており、かつ農薬・肥料がどちらもOFFであること
            const isOrganicCertified = oBox.checked && !pBox.checked && !fBox.checked;

            if (isOrganicCertified) {
                // 条件クリア時のみ自然派ストアを解放
                naturalStoreOption.disabled = false;
            } else {
                // 有機資材が外れている、または農薬・肥料が入っている場合はロック
                naturalStoreOption.disabled = true; 
                
                // もし今まさに「自然派ストア」が選ばれてしまっていたら、強制的に「農協」に戻す
                if (marketSel.value === "natural_store") {
                    marketSel.value = "JA";
                    alert("⚠️ 【出荷制限ルール】\n「自然派ストア」への出荷には、🌿有機栽培資材の導入（かつ特定農薬・化学肥料の不使用）が必須条件です。自動的に「農協」に切り替わりました。");
                }
            }
        }
    }

    // 3. 制限をクリアした状態の正しい資材で、リアルタイムシミュレーター表を再計算
    calculateLiveCardCost(cardIdx);
};

// 財務バナー更新（全農地カードの選択状態をリアルタイムにスキャンして合算）
function updateSetupFinancialBanner() {
    if (!gameState.currentLand) return;

    setupYearDisplay.textContent = gameState.year;
    sumCumExpense.textContent = `${gameState.cumExpenses.toLocaleString()} 円`;
    sumCumRevenue.textContent = `${gameState.cumRevenue.toLocaleString()} 円`;

    // 🌟 1. 初期値を0円からスタートし、土地代も各カードごとに1枚ずつ合算する
    let totalInvestment = 0; 
    
    // 🌟 2. 画面上のすべての農地カードをループして、土地賃料・人件費・資材費・苗代を正確に合算
    const cards = document.querySelectorAll(".land-strategy-card");
    cards.forEach(card => {
        // 【追加】土地1枚ずつの年間賃料を合算
        totalInvestment += gameState.currentLand.cost;

        const cropId = card.querySelector(".land-crop-select")?.value;
        if (!cropId) return;

        // 配置された従業員の人件費を合算
        card.querySelectorAll(".land-worker-select").forEach(sel => {
            const emp = EMPLOYEE_MASTER.find(e => e.id === sel.value);
            if (emp) totalInvestment += emp.cost;
        });

        // 導入された農業資材の費用を画面の表示金額基準で合算
        if (card.querySelector(".asset-machinery")?.checked) totalInvestment += 1500000;
        if (card.querySelector(".asset-house")?.checked) totalInvestment += 4000000;
        if (card.querySelector(".asset-it")?.checked) totalInvestment += 2000000;
        if (card.querySelector(".asset-pesticide")?.checked) totalInvestment += 500000;
        if (card.querySelector(".asset-fertilizer")?.checked) totalInvestment += 500000;
        if (card.querySelector(".asset-organic")?.checked) totalInvestment += 1000000;

        // 作物ごとの苗代コストを合算
        if (cropId === "cabbage") totalInvestment += 5000;
        else if (cropId === "corn") totalInvestment += 10000;
        else if (cropId === "strawberry") totalInvestment += 12000;
        else if (cropId === "tomato") totalInvestment += 10000;
        else if (cropId === "hakusai") totalInvestment += 8000;
        else if (cropId === "artichoke") totalInvestment += 12000;
        else if (cropId === "daikon") totalInvestment += 16000;
        else if (cropId === "japanese_parsley") totalInvestment += 8000;
    });

    // 🌟 3. 現在の資金から投資見込額を引いた「実質残高」と「初期資本金比」を計算
    const estimatedMoney = gameState.money - totalInvestment;
    const netChange = estimatedMoney - 100000000;
    
    sumCurrentMoney.textContent = `${estimatedMoney.toLocaleString()} 円`;

    const netChangeElement = document.getElementById("sum-net-change");
    if (netChangeElement) {
        if (netChange > 0) {
            netChangeElement.innerHTML = `<span style="color: #16a34a; font-weight: bold;">＋${netChange.toLocaleString()} 円</span>`;
        } else if (netChange < 0) {
            netChangeElement.innerHTML = `<span style="color: #dc2626; font-weight: bold;">－${Math.abs(netChange).toLocaleString()} 円</span>`;
        } else {
            netChangeElement.innerHTML = `<span style="color: #64748b; font-weight: bold;">±0 円 (維持)</span>`;
        }
    }
}

// --- 4. 画面遷移：タイトル ➔ セットアップ ---
startBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) { alert("名前を入力してください！"); return; }
    gameState.playerName = name;

    const randomIndex = Math.floor(Math.random() * LAND_MASTER.length);
    gameState.currentLand = LAND_MASTER[randomIndex];

    setupLandName.textContent = gameState.currentLand.name;
    setupLandDesc.textContent = gameState.currentLand.desc;

    generateLandStrategyUI();
    updateSetupFinancialBanner();

    startScreen.classList.add("hidden");
    setupScreen.classList.remove("hidden");
});

// --- 5. セットアップ完了 ➔ 経営開始 ---
let currentYearExpenses = 0;   
let currentYearStartMoney = 0; 

beginBusinessBtn.addEventListener("click", () => {
    gameState.landStrategies = [];
    // 💡【修正】初期値を0円にし、各土地のループ内で1枚ずつ賃料を徴収する
    let totalInvestment = 0; 

    const cards = document.querySelectorAll(".land-strategy-card");
    
    for (let card of cards) {
        // 【追加】各農地ごとに土地1枚ずつの年間賃料を正確に合算
        totalInvestment += gameState.currentLand.cost;

        const cropId = card.querySelector(".land-crop-select").value;
        const marketId = card.querySelector(".land-market-select").value;
        
        const cropObj = CROP_MASTER.find(c => c.id === cropId);
        const marketObj = MARKET_MASTER.find(m => m.id === marketId);

        const workerSelects = card.querySelectorAll(".land-worker-select");
        let employees = [];
        workerSelects.forEach(sel => {
            employees.push(EMPLOYEE_MASTER.find(e => e.id === sel.value));
        });

        let assets = [];
        const checkedBoxes = card.querySelectorAll('input[type="checkbox"]:checked');
        checkedBoxes.forEach(box => {
            assets.push(ASSET_MASTER.find(a => a.id === box.value));
        });

        employees.forEach(e => totalInvestment += e.cost);
        
        // 確定ボタンを押した際にも、画面の表示金額通りの資材コストを正確に徴収する
        checkedBoxes.forEach(box => {
            if (box.value === "machinery") totalInvestment += 1500000;
            if (box.value === "greenhouse") totalInvestment += 4000000;
            if (box.value === "it_system") totalInvestment += 2000000;
            if (box.value === "pesticide") totalInvestment += 500000;
            if (box.value === "fertilizer") totalInvestment += 500000;
            if (box.value === "organic") totalInvestment += 1000000;
        });
        
        // 苗代コストの計算用補正
        if (cropId === "cabbage") totalInvestment += 5000;
        else if (cropId === "corn") totalInvestment += 10000;
        else if (cropId === "strawberry") totalInvestment += 12000;
        else if (cropId === "tomato") totalInvestment += 10000;
        else if (cropId === "hakusai") totalInvestment += 8000;
        else if (cropId === "artichoke") totalInvestment += 12000;
        else if (cropId === "daikon") totalInvestment += 16000;
        else if (cropId === "japanese_parsley") totalInvestment += 8000;

        gameState.landStrategies.push({
            crop: cropObj,
            market: marketObj,
            employees: employees,
            assets: assets
        });
    }

    if (gameState.money < totalInvestment) {
        alert("初期資金が足りません！投資を少し減らして再調整してください。");
        return;
    }

    currentYearStartMoney = gameState.money;
    currentYearExpenses = totalInvestment;

    gameState.money -= totalInvestment;
    gameState.cumExpenses += totalInvestment; 

    displayPlayerName.textContent = gameState.playerName;
    landNameElement.textContent = gameState.currentLand.name;
    moneyElement.textContent = gameState.money.toLocaleString();
    currentYearElement.textContent = gameState.year;

    document.getElementById("financial-dashboard").classList.add("hidden");
    endYearBtn.classList.remove("hidden");
    document.getElementById("next-year-phase-btn").classList.add("hidden");

    alert(`【第 ${gameState.year} 年目 全農地・投資確定！】\n本期の投資総額: ${(totalInvestment).toLocaleString()}円\nメイン画面で決算を行いましょう！`);

    setupScreen.classList.add("hidden");
    gameContainer.classList.remove("hidden");
});

// --- 6. 決算ダッシュボードへの出力 ---
const financialDashboard = document.getElementById("financial-dashboard");
const dashboardTitle = document.getElementById("dashboard-title");
const dashGlobalEventName = document.getElementById("dash-global-event-name");
const dashLocalEventName = document.getElementById("dash-local-event-name");
const dashboardTableBody = document.getElementById("dashboard-table-body");
const nextYearPhaseBtn = document.getElementById("next-year-phase-btn");

const stmtStartMoney = document.getElementById("stmt-start-money");
const stmtTotalExpense = document.getElementById("stmt-total-expense");
const stmtTotalRevenue = document.getElementById("stmt-total-revenue");
const stmtEndMoney = document.getElementById("stmt-end-money");

endYearBtn.addEventListener("click", () => {
    const land = gameState.currentLand;
    const yearKey = "year" + gameState.year;
    const landPower = land.power[yearKey]; 

    const globalEvent = GLOBAL_EVENTS[Math.floor(Math.random() * GLOBAL_EVENTS.length)];
    const localEvent = LOCAL_EVENTS[Math.floor(Math.random() * LOCAL_EVENTS.length)];

    dashGlobalEventName.textContent = `🌍 ${globalEvent.name}`;
    dashLocalEventName.textContent = `📍 ${localEvent.name}`;
    dashboardTitle.textContent = `📊 第 ${gameState.year} 年度 決算ダッシュボード`;

    let totalYearRevenue = 0;
    dashboardTableBody.innerHTML = ""; 

    gameState.landStrategies.forEach((strat, index) => {
        const crop = strat.crop;
        const market = strat.market;
        const assets = strat.assets;

        const hasPesticide = assets.some(a => a.id === "pesticide");
        const hasFertilizer = assets.some(a => a.id === "fertilizer");
        const hasGreenhouse = assets.some(a => a.id === "greenhouse");

        let basePricePerKg = market.prices[crop.id];

        if (basePricePerKg === null) {
            dashboardTableBody.innerHTML += `
                <tr>
                    <td style="font-weight:bold;">🗺️ ${index + 1}枚目</td>
                    <td>${crop.name}<br><span style="font-size:11px; color:#64748b;">➔ ${market.name}</span></td>
                    <td>-</td>
                    <td class="stat-down">出荷不可</td>
                    <td>-</td>
                    <td>-</td>
                    <td style="font-weight:bold; color:#64748b;">0 円</td>
                </tr>
            `;
            return;
        }

        let finalPricePerKg = basePricePerKg;
        if (globalEvent.id === "boom_exotic" && crop.id === "artichoke") finalPricePerKg *= 2;
        if (globalEvent.id === "boom_traditional" && crop.id === "hakusai") finalPricePerKg *= 2;
        if (globalEvent.id === "rival" && market.id === "sixth_industry") finalPricePerKg *= 0.5;
        if (globalEvent.id === "bumper_crop" && ["cabbage", "corn", "strawberry", "tomato", "daikon"].includes(crop.id)) finalPricePerKg *= 0.5;
        if (globalEvent.id === "poor_crop" && ["cabbage", "corn", "strawberry", "tomato", "hakusai", "artichoke"].includes(crop.id)) finalPricePerKg *= 2;

        let planYieldKg = crop.yieldPerUnit * landPower; 
        let yieldRate = 1.0;
        let shieldStatus = "";

        if (localEvent.id === "pest") {
            if (hasPesticide) { shieldStatus = "🛡️農薬ガード"; } 
            else if (["cabbage", "corn", "strawberry", "hakusai", "artichoke", "japanese_parsley"].includes(crop.id)) yieldRate *= 0.5;
        }
        else if (localEvent.id === "disease") {
            if (["cabbage", "corn", "strawberry", "japanese_parsley"].includes(crop.id)) yieldRate *= 0.5;
            if (["hakusai", "artichoke", "daikon", "tomato"].includes(crop.id)) yieldRate *= 0;
        }
        else if (localEvent.id === "heavy_rain") {
            if (hasGreenhouse) { shieldStatus = "🛡️ハウスガード"; } 
            else {
                if (["cabbage", "corn", "daikon", "hakusai", "japanese_parsley"].includes(crop.id)) yieldRate *= 0.5;
                if (["strawberry", "tomato", "artichoke"].includes(crop.id)) yieldRate *= 0;
            }
        }
        else if (localEvent.id === "bad_growth") {
            if (hasFertilizer) { shieldStatus = "🛡️肥料ブースト"; } 
            else if (["cabbage", "tomato", "hakusai", "daikon", "japanese_parsley"].includes(crop.id)) yieldRate *= 0.5;
        }
        else if (localEvent.id === "animal_damage") {
            if (hasGreenhouse) { strat.assets = assets.filter(a => a.id !== "greenhouse"); }
            yieldRate *= 0;
        }
        else if (localEvent.id === "good_weather") {
            yieldRate *= 2;
        }

        // // 💡 決算本番用の【仕様書完全準拠】ITシステム連動型・収穫量制限＆技術判定
        let finalTechShortage = false;
        let totalFinalMultiplier = 0;
        let finalWorkerCount = 0;

        // 本番でこの農地にITシステムが導入されているかチェック
        const hasFinalIT = assets.some(a => a.id === "it_system");

        // 作物のアルファベットランクを判定
        let finalCropRankKey = "C";
        if (["corn", "daikon"].includes(crop.id)) finalCropRankKey = "B";
        if (["tomato", "strawberry", "japanese_parsley"].includes(crop.id)) finalCropRankKey = "A";
        if (["hakusai", "artichoke"].includes(crop.id)) finalCropRankKey = "S";

        strat.employees.forEach(e => {
            finalWorkerCount++;
            
            const empData = EMPLOYEE_MASTER.find(emp => emp.id === e.id);
            if (empData) {
                let workerRate = empData.rates[finalCropRankKey];

                // 本番時における、ITシステムによる制限解除の反映
                if (hasFinalIT && empData.needIT[finalCropRankKey]) {
                    workerRate = 1.0;
                }

                // ITシステムでの補正を行ってもなお、作物を育てられない場合は全滅
                if (workerRate === 0.0) {
                    finalTechShortage = true;
                }

                totalFinalMultiplier += workerRate;
            }
        });

        // 1人でも育てられない人が残っていれば、収量倍率は0倍（全滅）
        if (finalTechShortage) {
            totalFinalMultiplier = 0;
        }

        let avgFinalMultiplier = finalWorkerCount > 0 ? (totalFinalMultiplier / finalWorkerCount) : 0;
        
        // 本番の収穫量 ＝ 基礎収量 × ランダムイベント倍率 × 従業員全体の平均収穫倍率
        let actualYieldKg = planYieldKg * yieldRate * avgFinalMultiplier;
        let techShortageLabel = finalTechShortage ? " ⚠️技術不足で出荷不可" : "";

        let directStoreLotteryText = "";

        if (market.id === "direct_store") {
            const rates = [1.5, 1.2, 1.0, 0.5];
            const chosenRate = rates[Math.floor(Math.random() * rates.length)];
            actualYieldKg *= chosenRate;
            if (chosenRate === 1.5) directStoreLotteryText = "<br><span class='stat-up' style='font-size:11px;'>🎯くじ:大盛況(1.5倍)</span>";
            else if (chosenRate === 1.2) directStoreLotteryText = "<br><span class='stat-up' style='font-size:11px;'>📈くじ:好調(1.2倍)</span>";
            else if (chosenRate === 1.0) directStoreLotteryText = "<br><span style='font-size:11px; color:#94a3b8;'>➔くじ:通常(1.0倍)</span>";
            else if (chosenRate === 0.5) directStoreLotteryText = "<br><span class='stat-down' style='font-size:11px;'>🚨くじ:売残(0.5倍)</span>";
        }

        if (market.id === "restaurant" && actualYieldKg > 200) actualYieldKg = 200;
        if (market.id === "natural_store" && actualYieldKg > 250) actualYieldKg = 250;

        let cropRevenue = Math.round(actualYieldKg * finalPricePerKg);
        totalYearRevenue += cropRevenue;

        const yieldClass = actualYieldKg < planYieldKg ? "stat-down" : (actualYieldKg > planYieldKg ? "stat-up" : "");
        const priceClass = finalPricePerKg < basePricePerKg ? "stat-down" : (finalPricePerKg > basePricePerKg ? "stat-up" : "");

        dashboardTableBody.innerHTML += `
            <tr>
                <td style="font-weight:bold;">🗺️ ${index + 1}枚目</td>
                <td>${crop.name}<br><span style="font-size:11px; color:#64748b;">➔ ${market.name}</span></td>
                <td>${Math.round(planYieldKg).toLocaleString()} kg</td>
                <td class="${yieldClass}">${Math.round(actualYieldKg).toLocaleString()} kg ${techShortageLabel ? '<br><span style="color:#dc2626; font-weight:bold;">'+techShortageLabel+'</span>' : (shieldStatus ? '<br><span style="font-size:11px; color:#2e75b6;">'+shieldStatus+'</span>':'')}${market.id==='direct_store'?directStoreLotteryText:''}</td>
                <td>${basePricePerKg} 円</td>
                <td class="${priceClass}">${finalPricePerKg} 円</td>
                <td style="font-weight:bold; color:#1e40af;">＋${cropRevenue.toLocaleString()} 円</td>
            </tr>
        `;
    });

    gameState.money += totalYearRevenue;
    gameState.cumRevenue += totalYearRevenue; 
    moneyElement.textContent = gameState.money.toLocaleString();

    stmtStartMoney.textContent = `${currentYearStartMoney.toLocaleString()} 円`;
    stmtTotalExpense.textContent = `- ${currentYearExpenses.toLocaleString()} 円`;
    stmtTotalRevenue.textContent = `＋ ${totalYearRevenue.toLocaleString()} 円`;
    stmtEndMoney.textContent = `${gameState.money.toLocaleString()} 円`;

    financialDashboard.classList.remove("hidden");
    endYearBtn.classList.add("hidden");
    nextYearPhaseBtn.classList.remove("hidden");
});

// --- 7. 次の年への移行フェーズ ---
// --- 7. 次の年への移行フェーズ ---
nextYearPhaseBtn.addEventListener("click", () => {
    if (gameState.year >= 3) {
        gameContainer.classList.add("hidden");
        resultScreen.classList.remove("hidden");
        finalMoneyElement.textContent = gameState.money.toLocaleString();
        showFinalResult();
    } else {
        // 💡 画面を切り替える前に、現在のカード上の選択状態（作物・従業員・資材）をマスターに記憶させる
        saveCurrentStrategies();

        gameState.year += 1;

        // 保存された状態を引き継いでUIを再構築する
        generateLandStrategyUI(); 
        updateSetupFinancialBanner(); 

        gameContainer.classList.add("hidden");
        setupScreen.classList.remove("hidden");
    }
});

// 💡【バグ修正版】エラーを解消し、2年目→3年目も全選択データを100%記憶する関数
function saveCurrentStrategies() {
    const cards = landCardsContainer.querySelectorAll(".land-strategy-card");
    cards.forEach((card, idx) => {
        if (!gameState.landStrategies[idx]) {
            gameState.landStrategies[idx] = {};
        }
        
        // 1. 作物の選択を記憶
        const cropSel = card.querySelector(".land-crop-select");
        if (cropSel) gameState.landStrategies[idx].cropId = cropSel.value;

        // 2. 販売先の選択を記憶
        const marketSel = card.querySelector(".land-market-select");
        if (marketSel) gameState.landStrategies[idx].marketId = marketSel.value;

        // 3. 従業員の選択を記憶
        const workerSelects = card.querySelectorAll(".land-worker-select");
        let workerIds = [];
        workerSelects.forEach(sel => workerIds.push(sel.value));
        gameState.landStrategies[idx].employeeIds = workerIds;

        // 4. 各資材のチェック状態を正しく安全に記憶
        let assetIds = [];
        if (card.querySelector(".asset-machinery")?.checked) assetIds.push("machinery");
        if (card.querySelector(".asset-house")?.checked) assetIds.push("greenhouse");
        if (card.querySelector(".asset-it")?.checked) assetIds.push("it_system");
        if (card.querySelector(".asset-pesticide")?.checked) assetIds.push("pesticide");
        if (card.querySelector(".asset-fertilizer")?.checked) assetIds.push("fertilizer");
        if (card.querySelector(".asset-organic")?.checked) assetIds.push("organic");
        
        gameState.landStrategies[idx].assetIds = assetIds;
    });
}

function showFinalResult() {
    if (gameState.money >= 25000000) {
        resultRankElement.textContent = "🏆 ランクＳ：伝説のメガ農家";
        resultCommentElement.textContent = `素晴らしい！すべての農地に最適な人材と資材を個別配分し、リスクを完璧にヘッジしました。素晴らしい采配です！`;
    } else if (gameState.money >= 20000000) {
        resultRankElement.textContent = "👍 ランクＡ：優秀な黒字経営者";
        resultCommentElement.textContent = `見事な経営です！土地ごとの特性を活かして利益を堅実に残しました。立派な多角化農業経営者です。`;
    } else {
        resultRankElement.textContent = "📉 ランクＣ：破産寸前・赤字経営";
        resultCommentElement.textContent = `残念…！リソースを分散させすぎて、特定の土地の投資（人件費・資材費）が回収できませんでした。次はコスト配分を意識してみましょう。`;
    }
}