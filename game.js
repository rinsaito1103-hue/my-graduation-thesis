// === game.js ===
// --- 1. 初期データの設定 ---
let gameState = {
    playerName: "",
    year: 1,
    money: 100000000,
    cumExpenses: 0,
    cumRevenue: 0,
    currentLand: null,
    landStrategies: [],
    landHistory: [],
    history: [
        { year: 0, money: 100000000, expense: 0, revenue: 0 }
    ]
};

// 🌟【新設】先生からのイベントデータを受信・保持するための変数
let receivedGlobalEventId = null;
let receivedLocalEventId = null;

// 📡【新設】Supabase 受信アンテナの設定
const SUPABASE_URL = 'https://lozwsuhkcbuzbdynnyml.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvendzdWhrY2J1emJkeW5ueW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDg1MzgsImV4cCI6MjA5NjEyNDUzOH0.bmk4mz5NyNUqWlImBqWBRISQAzJq3GF6Ply7mG3yNAc'; // ※ご自身のキー

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- 2. 画面要素（DOM）の取得 ---
const startScreen = document.getElementById("start-screen");
const landRevealScreen = document.getElementById("land-reveal-screen");
const setupScreen = document.getElementById("setup-screen");
const gameContainer = document.getElementById("game-container");
const resultScreen = document.getElementById("result-screen");

const nameInput = document.getElementById("name-input");
const startBeginnerBtn = document.getElementById("start-beginner-btn"); // 
const startAdvancedBtn = document.getElementById("start-advanced-btn"); //
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
const finalFinancialChartElement = document.getElementById("final-financial-chart");

const setupYearDisplay = document.getElementById("setup-year-display");
const sumCurrentMoney = document.getElementById("sum-current-money");
const sumCumExpense = document.getElementById("sum-cum-expense");
const sumCumRevenue = document.getElementById("sum-cum-revenue");

let currentYearPlannedProfitSum = 0;

// 💡【新設】イベント受信状態をチェックして決算ボタンを制御する関数
function checkAndEnableEndYearBtn() {
    if (endYearBtn && !endYearBtn.classList.contains("hidden")) {
        if (receivedGlobalEventId && receivedLocalEventId) {
            // 受信完了 ➔ ボタンをオレンジにして押せるようにする
            endYearBtn.disabled = false;
            endYearBtn.textContent = "📄 この年度の決算を行う（イベント受信完了！）";
            endYearBtn.style.backgroundColor = "#c65911";
            endYearBtn.style.cursor = "pointer";
        } else {
            // 未受信 ➔ ボタンをグレーにしてロックする
            endYearBtn.disabled = true;
            endYearBtn.textContent = "⏳ 先生のイベント発表待ち...";
            endYearBtn.style.backgroundColor = "#94a3b8";
            endYearBtn.style.cursor = "not-allowed";
        }
    }
}

// 資材コストをASSET_MASTERから取得するヘルパー関数（ハードコードを廃止）
function getAssetCost(assetId) {
    const asset = ASSET_MASTER.find(a => a.id === assetId);
    return asset ? asset.cost : 0;
}

// UIラベル用：資材コストを万円表示に変換
function getAssetCostLabel(assetId) {
    const cost = getAssetCost(assetId);
    if (cost === 0) return "無料";
    return `＋${(cost / 10000).toLocaleString()}万`;
}

// ツールチップ用：資材の説明文をASSET_MASTERから取得
function getAssetDesc(assetId) {
    const asset = ASSET_MASTER.find(a => a.id === assetId);
    return asset ? asset.desc : "";
}

// --- 3. UIの動的生成ロジック ---
function generateLandStrategyUI() {
    const cardCount = gameState.currentLand.totalCards; 
    const yearKey = "year" + gameState.year;
    const reqWorkers = gameState.currentLand.requiredWorkers[yearKey]; 

    landCardsContainer.innerHTML = ""; 

    for (let i = 1; i <= cardCount; i++) {
        let saved = gameState.landStrategies[i - 1] || null;

        let workerSelectsHtml = "";
        for (let w = 1; w <= reqWorkers; w++) {
            let savedWorkerId = (saved && saved.employeeIds && saved.employeeIds[w - 1]) ? saved.employeeIds[w - 1] : "";
            
            // 安全な変数にしてから埋め込む
            const isUnselected = savedWorkerId === '' ? 'selected' : '';
            const isBeginner = savedWorkerId === 'beginner' ? 'selected' : '';
            const isExperienced = savedWorkerId === 'experienced' ? 'selected' : '';
            const isVeteran = savedWorkerId === 'veteran' ? 'selected' : '';

            workerSelectsHtml += `
                <select class="land-worker-select" data-land-idx="${i}" onchange="calculateLiveCardCost(${i})">
                    <option value="" ${isUnselected}>スタッフ${w}: -- 未選択 --</option>
                    <option value="beginner" ${isBeginner}>スタッフ${w}:初心者 (200万)</option>
                    <option value="experienced" ${isExperienced}>スタッフ${w}:経験者 (600万)</option>
                    <option value="veteran" ${isVeteran}>スタッフ${w}:ベテラン (800万)</option>
                </select>
            `;
        }

        const savedCropId = saved ? saved.cropId : "";
        const savedMarketId = saved ? saved.marketId : "";

        // 🚜高性能農機・🏠ビニールハウスは「有効期限」ベースで自動継続判定する
        const landHist = gameState.landHistory[i - 1] || {};
        const machineryActive = !!(landHist.machineryExpireYear && gameState.year <= landHist.machineryExpireYear);
        const greenhouseActive = !!(landHist.greenhouseExpireYear && gameState.year <= landHist.greenhouseExpireYear);

        const hasMachinery = machineryActive;
        const hasGreenhouse = greenhouseActive;
        const machineryCheckboxAttr = machineryActive ? "checked disabled" : "";
        const greenhouseCheckboxAttr = greenhouseActive ? "checked disabled" : "";
        const machineryLabelStyle = machineryActive ? "style='color: #64748b; font-weight: bold; background: #f1f5f9; padding: 2px 5px; border-radius:3px; cursor: not-allowed;'" : "";
        const greenhouseLabelStyle = greenhouseActive ? "style='color: #64748b; font-weight: bold; background: #f1f5f9; padding: 2px 5px; border-radius:3px; cursor: not-allowed;'" : "";
        const machineryActiveNote = machineryActive ? ` <span style="color:#16a34a;">✅有効中(第${landHist.machineryExpireYear}年目まで)</span>` : "";
        const greenhouseActiveNote = greenhouseActive ? ` <span style="color:#16a34a;">✅有効中(第${landHist.greenhouseExpireYear}年目まで)</span>` : "";

        const hasPesticide = saved && saved.assetIds ? saved.assetIds.includes("pesticide") : false;
        const hasFertilizer = saved && saved.assetIds ? saved.assetIds.includes("fertilizer") : false;
        const hasOrganic = saved && saved.assetIds ? saved.assetIds.includes("organic") : false;
        
        // ITシステムの制限ロジックを安全に分解
        const hasITSystem = saved && saved.assetIds ? saved.assetIds.includes("it_system") : false;
        const itCheckboxAttr = hasITSystem ? "checked disabled" : "";
        const itLabelStyle = hasITSystem ? "style='color: #64748b; font-weight: bold; background: #f1f5f9; padding: 2px 5px; border-radius:3px; cursor: not-allowed;'" : "";
        const isItSavedChecked = (!hasITSystem && saved && saved.assetIds && saved.assetIds.includes("it_system")) ? "checked" : "";

        const cardHtml = `
            <div class="land-strategy-card" data-idx="${i}">
                <h4>🗺️ ${i}枚目の農地 個別経営戦略</h4>
                <div class="card-inner-flex">
                    <div class="land-strategy-card-left">
                        <label>🌾 作付する作物:</label>
                        <select class="land-crop-select" onchange="calculateLiveCardCost(${i})">
                            <option value="" ${savedCropId === '' ? 'selected' : ''}>-- 未選択 --</option>
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
                            <option value="" ${savedMarketId === '' ? 'selected' : ''}>-- 未選択 --</option>
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
                            <label class="asset-label" data-tooltip="${getAssetDesc('machinery')}" id="label-machinery-${i}" ${machineryLabelStyle}><input type="checkbox" class="asset-machinery" ${hasMachinery ? "checked" : ""} ${machineryCheckboxAttr} value="machinery" onchange="handleAssetExclusion(this, ${i}, 'machinery')">🚜高性能農機 (${getAssetCostLabel("machinery")})${machineryActiveNote}</label>
                            <label class="asset-label" data-tooltip="${getAssetDesc('greenhouse')}" id="label-house-${i}" ${greenhouseLabelStyle}><input type="checkbox" class="asset-house" ${hasGreenhouse ? "checked" : ""} ${greenhouseCheckboxAttr} value="greenhouse" onchange="handleAssetExclusion(this, ${i}, 'greenhouse')">🏠ハウス施設 (${getAssetCostLabel("greenhouse")})${greenhouseActiveNote}</label>
                            <label class="asset-label" data-tooltip="${getAssetDesc('it_system')}" id="label-it-${i}" ${itLabelStyle}><input type="checkbox" class="asset-it" ${itCheckboxAttr} ${isItSavedChecked} value="it_system" onchange="handleAssetExclusion(this, ${i}, 'it_system')">💻ITシステム (${getAssetCostLabel("it_system")})</label>
                            <label class="asset-label" data-tooltip="${getAssetDesc('pesticide')}"><input type="checkbox" class="asset-pesticide" ${hasPesticide ? "checked" : ""} value="pesticide" onchange="handleAssetExclusion(this, ${i}, 'pesticide')">🧪特定農薬 (${getAssetCostLabel("pesticide")})</label>
                            <label class="asset-label" data-tooltip="${getAssetDesc('fertilizer')}"><input type="checkbox" class="asset-fertilizer" ${hasFertilizer ? "checked" : ""} value="fertilizer" onchange="handleAssetExclusion(this, ${i}, 'fertilizer')">🧪化学肥料 (${getAssetCostLabel("fertilizer")})</label>
                            <label class="asset-label" data-tooltip="${getAssetDesc('organic')}"><input type="checkbox" class="asset-organic" ${hasOrganic ? "checked" : ""} value="organic" onchange="handleAssetExclusion(this, ${i}, 'organic')">🌿 有機栽培資材 (${getAssetCostLabel("organic")})</label>
                        </div>
                    </div>
                </div>
                <table class="live-simulation-table" id="simulation-table-${i}"></table>
                <div class="land-cost-counter" id="card-cost-counter-${i}">💰 この農地の投資小計: 0 円</div>
            </div>
        `;
        landCardsContainer.insertAdjacentHTML("beforeend", cardHtml);
        calculateLiveCardCost(i); 
    }
}

// 💡 リアルタイム営農シミュレーター＆コスト合算システム
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
    if (gameState.currentLand && gameState.currentLand.power) {
        const yearKey = "year" + gameState.year;
        landPower = gameState.currentLand.power[yearKey] || 1.0;
    }

    const marketId = card.querySelector(".land-market-select").value;
    let basePricePerKg = 0; 
    let saleLimitText = "上限なし";

    const marketObj = MARKET_MASTER.find(m => m.id === marketId);
    if (marketObj) {
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

    if (techShortage) totalWorkerYieldMultiplier = 0;
    let avgWorkerMultiplier = workerCount > 0 ? (totalWorkerYieldMultiplier / workerCount) : 0;
    let planYield = baseYieldPerUnit * landPower * avgWorkerMultiplier; 
    
    let techStatusText = "<span style='color:#16a34a; font-weight:bold;'>合格</span>";
    if (techShortage) {
        planYield = 0;
        techStatusText = "<span style='color:#dc2626; font-weight:bold;'>⚠️技術不足・出荷不可</span>";
    }

    const cardIndex = parseInt(card.getAttribute("data-idx")) - 1;
    let hist = gameState.landHistory[cardIndex] || { lastFamily: null, consecutiveCounter: 0 };
    let tempCounter = hist.consecutiveCounter;

    // 前年と同じ科ならカウンター増加、違うならリセット（輪作）
    if (hist.lastFamily === crop?.family && hist.lastFamily !== null) {
        tempCounter += 1;
    } else {
        tempCounter = 0;
    }

    const hasOrganic = card.querySelector(".asset-organic")?.checked;
    const hasIT = card.querySelector(".asset-it")?.checked && !card.querySelector(".asset-it")?.disabled;
    const hasFertilizer = card.querySelector(".asset-fertilizer")?.checked;

    let replantMultiplier = 1.0;
    let replantStatusText = "<span style='color:#64748b;'>正常（輪作/1年目）</span>";

    if (tempCounter > 0) {
        if (hasOrganic) {
            replantStatusText = "<span style='color:#2e75b6;'>🌿 有機防衛（被害無効化）</span>";
        } else if (hasIT && hasFertilizer) {
            replantStatusText = "<span style='color:#2e75b6;'>💻🧪 データ施肥（被害無効化）</span>";
        } else {
            if (tempCounter === 1) { replantMultiplier = 0.8; replantStatusText = "<span style='color:#f59e0b; font-weight:bold;'>⚠️ 連作2年目 (収量0.8倍)</span>"; }
            else if (tempCounter === 2) { replantMultiplier = 0.4; replantStatusText = "<span style='color:#dc2626; font-weight:bold;'>🚨 連作3年目 (収量0.4倍)</span>"; }
            else { replantMultiplier = 0.1; replantStatusText = "<span style='color:#7f1d1d; font-weight:bold;'>☠️ 土壌崩壊 (収量0.1倍)</span>"; }
        }
    }
    
    planYield = planYield * replantMultiplier; // 連作ペナルティを適用

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
    const machineryCheckbox = card.querySelector(".asset-machinery");
    if (machineryCheckbox?.checked && !machineryCheckbox.disabled) assetCost += getAssetCost("machinery");
    const greenhouseCheckbox = card.querySelector(".asset-house");
    if (greenhouseCheckbox?.checked && !greenhouseCheckbox.disabled) assetCost += getAssetCost("greenhouse");
    const itCheckbox = card.querySelector(".asset-it");
    if (itCheckbox?.checked && !itCheckbox.disabled) assetCost += getAssetCost("it_system");
    if (card.querySelector(".asset-pesticide")?.checked) assetCost += getAssetCost("pesticide");
    if (card.querySelector(".asset-fertilizer")?.checked) assetCost += getAssetCost("fertilizer");
    if (card.querySelector(".asset-organic")?.checked) assetCost += getAssetCost("organic");

    let cardTotalInvestment = seedCost + laborCost + assetCost + landCostBase;
    let estimatedProfit = Math.round(estimatedRevenue - cardTotalInvestment); 

    const idx = card.getAttribute("data-idx");
    const simTable = document.getElementById(`simulation-table-${idx}`);
    
    // エラー防止のため、計算結果の色を安全に変数の外に出す
    const profitColor = estimatedProfit >= 0 ? '#16a34a' : '#dc2626';

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
                <tr class="row-status"><td>🔄 連作・土壌状態</td><td class="text-center">-</td><td class="text-right">${replantStatusText}</td></tr>
                <tr class="row-revenue-header"><td>売上</td><td class="text-center">円</td><td class="text-right">${estimatedRevenue.toLocaleString()}</td></tr>
                <tr><td>　販売価格 (単価)</td><td class="text-center">円</td><td class="text-right">${basePricePerKg.toLocaleString()}</td></tr>
                <tr><td>　計画収穫量</td><td class="text-center">kg</td><td class="text-right">${Math.round(planYield)}</td></tr>
                <tr><td>　　土地パワー</td><td class="text-center">倍</td><td class="text-right">${landPower}</td></tr>
                <tr><td>　　標準収穫量ベース</td><td class="text-center">kg</td><td class="text-right">${baseYieldPerUnit}</td></tr>
                <tr><td>　　従業員の収穫可能量制限</td><td class="text-center">倍</td><td class="text-right">${avgWorkerMultiplier.toFixed(1)} 倍</td></tr>
                <tr><td>　販売上限制限</td><td class="text-center">kg</td><td class="text-right">${saleLimitText}</td></tr>
                <tr class="row-expense-header"><td>投資小計 (費用)</td><td class="text-center">円</td><td class="text-right">${cardTotalInvestment.toLocaleString()}</td></tr>
                <tr><td>　土地の貸借料</td><td class="text-center">円</td><td class="text-right">${landCostBase.toLocaleString()}</td></tr>
                <tr><td>　種苗・苗木費</td><td class="text-center">円</td><td class="text-right">${seedCost.toLocaleString()}</td></tr>
                <tr><td>　従業員人件費</td><td class="text-center">円</td><td class="text-right">${laborCost.toLocaleString()}</td></tr>
                <tr><td>　設備・IT投資費</td><td class="text-center">円</td><td class="text-right">${assetCost.toLocaleString()}</td></tr>
                <tr class="row-profit-header"><td>見込利益 (売上－投資小計)</td><td class="text-center">円</td><td class="text-right" style="color: ${profitColor}; font-weight:bold;">${estimatedProfit.toLocaleString()}</td></tr>
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

window.handleAssetExclusion = function(element, cardIdx, type) {
    const card = document.querySelector(`.land-strategy-card[data-idx="${cardIdx}"]`);
    if (!card) return;

    const pBox = card.querySelector(".asset-pesticide");
    const fBox = card.querySelector(".asset-fertilizer");
    const oBox = card.querySelector(".asset-organic");

    const allChecked = card.querySelectorAll('input[type="checkbox"]:checked');
    if (allChecked.length > 3) {
        alert("🚨 【資材制限ルール】\n1つの農地に導入できる農業資材・施設は「最大3つまで」です！");
        element.checked = false; 
        return; 
    }

    if (type === "organic" && oBox.checked) {
        pBox.checked = false; 
        fBox.checked = false;
    } else if ((type === "pesticide" || type === "fertilizer") && (pBox.checked || fBox.checked)) {
        oBox.checked = false;
    }

    const marketSel = card.querySelector(".land-market-select");
    if (marketSel) {
        const naturalStoreOption = marketSel.querySelector('option[value="natural_store"]');
        if (naturalStoreOption) {
            const isOrganicCertified = oBox.checked && !pBox.checked && !fBox.checked;
            if (isOrganicCertified) {
                naturalStoreOption.disabled = false;
            } else {
                naturalStoreOption.disabled = true; 
                if (marketSel.value === "natural_store") {
                    marketSel.value = "JA";
                    alert("⚠️ 【出荷制限ルール】\n「自然派ストア」への出荷には、🌿有機栽培資材の導入が必須です。自動的に「農協」に切り替わりました。");
                }
            }
        }
    }

    calculateLiveCardCost(cardIdx);
};

function updateSetupFinancialBanner() {
    if (!gameState.currentLand) return;

    setupYearDisplay.textContent = gameState.year;
    sumCumExpense.textContent = `${gameState.cumExpenses.toLocaleString()} 円`;
    sumCumRevenue.textContent = `${gameState.cumRevenue.toLocaleString()} 円`;

    let totalInvestment = 0; 
    const cards = document.querySelectorAll(".land-strategy-card");
    cards.forEach(card => {
        totalInvestment += gameState.currentLand.cost;
        const cropId = card.querySelector(".land-crop-select")?.value;
        if (!cropId) return;

        card.querySelectorAll(".land-worker-select").forEach(sel => {
            const emp = EMPLOYEE_MASTER.find(e => e.id === sel.value);
            if (emp) totalInvestment += emp.cost;
        });

        if (card.querySelector(".asset-machinery")?.checked) totalInvestment += getAssetCost("machinery");
        if (card.querySelector(".asset-house")?.checked) totalInvestment += getAssetCost("greenhouse");
        if (card.querySelector(".asset-it")?.checked) totalInvestment += getAssetCost("it_system");
        if (card.querySelector(".asset-pesticide")?.checked) totalInvestment += getAssetCost("pesticide");
        if (card.querySelector(".asset-fertilizer")?.checked) totalInvestment += getAssetCost("fertilizer");
        if (card.querySelector(".asset-organic")?.checked) totalInvestment += getAssetCost("organic");

        if (cropId === "cabbage") totalInvestment += 5000;
        else if (cropId === "corn") totalInvestment += 10000;
        else if (cropId === "strawberry") totalInvestment += 12000;
        else if (cropId === "tomato") totalInvestment += 10000;
        else if (cropId === "hakusai") totalInvestment += 8000;
        else if (cropId === "artichoke") totalInvestment += 12000;
        else if (cropId === "daikon") totalInvestment += 16000;
        else if (cropId === "japanese_parsley") totalInvestment += 8000;
    });

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
function startGame(config) {
    const roomId = document.getElementById("room-id-input").value.trim();
    const name = nameInput.value.trim();
    if (!roomId) { alert("ルームIDを入力してください！"); return; }
    if (!name) { alert("名前を入力してください！"); return; }
    
    gameState.roomId = roomId; // 🌟ルームIDを保存
    gameState.playerName = name;
    gameState.difficulty = config.id;

    // 🌟ここに追加：入力されたルームID専用の通信アンテナを立てる
    const channel = supabaseClient.channel(`room-${roomId}`);
    channel.on('broadcast', { event: 'yearly_events' }, payload => {
        console.log("📡 先生からイベントを受信しました！", payload);
        receivedGlobalEventId = payload.payload.global_id;
        let localId = payload.payload.local_id;
        if (localId === "random_per_team") {
            const randIdx = Math.floor(Math.random() * LOCAL_EVENTS.length);
            localId = LOCAL_EVENTS[randIdx].id;
        }
        receivedLocalEventId = localId;
        checkAndEnableEndYearBtn(); 
    }).subscribe();

    // 🌟 分離した設定ファイルから初期資金を読み込んでセットする
    gameState.money = config.startMoney;
    gameState.history[0].money = config.startMoney;

    const randomIndex = Math.floor(Math.random() * LAND_MASTER.length);
    gameState.currentLand = LAND_MASTER[randomIndex];
    const land = gameState.currentLand;
    
    // 農地の枚数分だけ、土壌ダメージのカウンターを用意する（連作障害用）
    gameState.landHistory = Array(land.totalCards).fill(null).map(() => ({ 
        lastFamily: null, 
        consecutiveCounter: 0,
        machineryExpireYear: null,   // 🚜高性能農機：有効期限（この年まで有効）
        greenhouseExpireYear: null   // 🏠ビニールハウス：有効期限（この年まで有効）
    }));

    // 土地公開画面に情報をセット
    document.getElementById("land-reveal-bg").style.backgroundImage = `url("${land.image}")`;
    document.getElementById("land-reveal-img").src = land.image;
    document.getElementById("land-reveal-name").textContent = land.name;
    document.getElementById("land-reveal-desc").textContent = land.desc;
    document.getElementById("land-reveal-cost").textContent =
        land.cost === 0 ? "無料（0円）" : `${(land.cost / 10000).toLocaleString()}万円 / 年`;
    document.getElementById("land-reveal-power").textContent =
        `1年目:${land.power.year1} → 2年目:${land.power.year2} → 3年目:${land.power.year3}`;
    document.getElementById("land-reveal-workers").textContent =
        `1年目:${land.requiredWorkers.year1}人 → 2年目:${land.requiredWorkers.year2}人 → 3年目:${land.requiredWorkers.year3}人`;
    document.getElementById("land-reveal-cards").textContent = `${land.totalCards}枚`;

    startScreen.classList.add("hidden");
    landRevealScreen.classList.remove("hidden");

    // 🌟 ステータスバーを更新して表示
    document.getElementById("display-room-id").textContent = gameState.roomId;
    document.getElementById("display-difficulty").textContent = config.name;
    document.getElementById("status-bar").classList.remove("hidden");

    startScreen.classList.add("hidden");
    landRevealScreen.classList.remove("hidden");
}

// 🌟 ボタンを押したときに、作成した設定オブジェクトを渡す
startBeginnerBtn.addEventListener("click", () => startGame(CONFIG_BEGINNER));
startAdvancedBtn.addEventListener("click", () => startGame(CONFIG_ADVANCED));

// 土地公開 → 戦略設定へ進むボタン（新規追加）
document.getElementById("land-reveal-proceed-btn").addEventListener("click", () => {
    const land = gameState.currentLand;
    setupLandName.textContent = land.name;
    setupLandDesc.textContent = land.desc;

    generateLandStrategyUI();
    updateSetupFinancialBanner();

    landRevealScreen.classList.add("hidden");
    setupScreen.classList.remove("hidden");
    setTimeout(renderFinancialChart, 50);
});

// --- 5. セットアップ完了 ➔ 経営開始 ---
let currentYearExpenses = 0;   
let currentYearStartMoney = 0; 

beginBusinessBtn.addEventListener("click", () => {
    const cardsForValidation = document.querySelectorAll(".land-strategy-card");
    for (let card of cardsForValidation) {
        const idx = card.getAttribute("data-idx");
        const cropVal = card.querySelector(".land-crop-select")?.value;
        const marketVal = card.querySelector(".land-market-select")?.value;
        const workerVals = [...card.querySelectorAll(".land-worker-select")].map(sel => sel.value);

        if (!cropVal) { alert(`⚠️ ${idx}枚目の農地で「作付する作物」が未選択です。選択してください。`); return; }
        if (!marketVal) { alert(`⚠️ ${idx}枚目の農地で「出荷・販売先」が未選択です。選択してください。`); return; }
        if (workerVals.some(v => !v)) { alert(`⚠️ ${idx}枚目の農地で未選択の「配置従業員」があります。すべて選択してください。`); return; }
    }

    gameState.landStrategies = [];
    let totalInvestment = 0; 

    const cards = document.querySelectorAll(".land-strategy-card");
    for (let card of cards) {
        totalInvestment += gameState.currentLand.cost;
        const cropId = card.querySelector(".land-crop-select").value;
        const marketId = card.querySelector(".land-market-select").value;
        
        const cropObj = CROP_MASTER.find(c => c.id === cropId);
        const marketObj = MARKET_MASTER.find(m => m.id === marketId);

        const workerSelects = card.querySelectorAll(".land-worker-select");
        const employees = [...workerSelects]
            .map(sel => EMPLOYEE_MASTER.find(e => e.id === sel.value))
            .filter(Boolean);

        const checkedBoxes = card.querySelectorAll('input[type="checkbox"]:checked');
        const assets = [...checkedBoxes]
            .map(box => ASSET_MASTER.find(a => a.id === box.value))
            .filter(Boolean);

        // 🚜高性能農機・🏠ビニールハウスは「有効期限」を農地ごとに記録・参照する
        const cardIdx = parseInt(card.getAttribute("data-idx")) - 1;
        if (!gameState.landHistory[cardIdx]) {
            gameState.landHistory[cardIdx] = { lastFamily: null, consecutiveCounter: 0, machineryExpireYear: null, greenhouseExpireYear: null };
        }
        const landHistForAsset = gameState.landHistory[cardIdx];

        employees.forEach(e => totalInvestment += e.cost);
        assets.forEach(asset => {
            if (asset.id === "machinery") {
                const wasActive = landHistForAsset.machineryExpireYear && gameState.year <= landHistForAsset.machineryExpireYear;
                if (!wasActive) {
                    totalInvestment += asset.cost; // 新規購入時のみ課金
                    landHistForAsset.machineryExpireYear = gameState.year + asset.duration - 1;
                }
                // 有効期間中（継続効果）は再課金しない
            } else if (asset.id === "greenhouse") {
                const wasActive = landHistForAsset.greenhouseExpireYear && gameState.year <= landHistForAsset.greenhouseExpireYear;
                if (!wasActive) {
                    totalInvestment += asset.cost; // 新規購入時のみ課金
                    landHistForAsset.greenhouseExpireYear = gameState.year + asset.duration - 1;
                }
                // 有効期間中（継続効果）は再課金しない
            } else {
                totalInvestment += asset.cost;
            }
        });
        
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

    currentYearPlannedProfitSum = 0;
    cards.forEach(c => {
        const cropId = c.querySelector(".land-crop-select").value;
        const landCostBase = gameState.currentLand ? gameState.currentLand.cost : 0;
        const crop = CROP_MASTER.find(cr => cr.id === cropId);
        let baseYieldPerUnit = crop ? crop.yieldPerUnit : 0;
        
        const yKey = "year" + gameState.year;
        let lPower = gameState.currentLand ? gameState.currentLand.power[yKey] : 1.0;
        
        let lCost = 0; let wCount = 0; let tShortage = false; let tMultiplier = 0;
        let cRank = "C";
        if (["corn", "daikon"].includes(cropId)) cRank = "B";
        if (["tomato", "strawberry", "japanese_parsley"].includes(cropId)) cRank = "A";
        if (["hakusai", "artichoke"].includes(cropId)) cRank = "S";
        const hasIT = c.querySelector(".asset-it")?.checked;
        
        c.querySelectorAll(".land-worker-select").forEach(sel => {
            wCount++;
            const empData = EMPLOYEE_MASTER.find(e => e.id === sel.value);
            if (empData) {
                lCost += empData.cost;
                let wRate = empData.rates[cRank];
                if (hasIT && empData.needIT[cRank]) wRate = 1.0;
                if (wRate === 0.0) tShortage = true;
                tMultiplier += wRate;
            }
        });
        if (tShortage) tMultiplier = 0;
        let avgM = wCount > 0 ? (tMultiplier / wCount) : 0;
        let pYield = baseYieldPerUnit * lPower * avgM;
        
        const marketId = c.querySelector(".land-market-select").value;
        let bPrice = 0;
        const mObj = MARKET_MASTER.find(m => m.id === marketId);
        if (mObj) bPrice = mObj.prices[cropId] || 0;
        
        let aSale = pYield;
        if (marketId === "restaurant" && aSale > 200) aSale = 200;
        if (marketId === "natural_store" && aSale > 250) aSale = 250;
        let estRev = Math.round(aSale * bPrice);
        
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
        if (c.querySelector(".asset-machinery")?.checked) assetCost += getAssetCost("machinery");
        if (c.querySelector(".asset-house")?.checked) assetCost += getAssetCost("greenhouse");
        if (c.querySelector(".asset-it")?.checked) assetCost += getAssetCost("it_system");
        if (c.querySelector(".asset-pesticide")?.checked) assetCost += getAssetCost("pesticide");
        if (c.querySelector(".asset-fertilizer")?.checked) assetCost += getAssetCost("fertilizer");
        if (c.querySelector(".asset-organic")?.checked) assetCost += getAssetCost("organic");
        
        let totalInv = seedCost + lCost + assetCost + landCostBase;
        currentYearPlannedProfitSum += Math.round(estRev - totalInv);
    });

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
    checkAndEnableEndYearBtn(); 

    document.getElementById("next-year-phase-btn").classList.add("hidden");
    alert(`【第 ${gameState.year} 年目 全農地・投資確定！】\n本期の投資総額: ${(totalInvestment).toLocaleString()}円`);

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
    const globalEvent = GLOBAL_EVENTS.find(e => e.id === receivedGlobalEventId) || GLOBAL_EVENTS[0];
    const localEvent = LOCAL_EVENTS.find(e => e.id === receivedLocalEventId) || LOCAL_EVENTS[0];

    const land = gameState.currentLand;
    const yearKey = "year" + gameState.year;
    const landPower = land.power[yearKey] || 1.0;

    dashGlobalEventName.textContent = `🌍 ${globalEvent.name}`;
    dashLocalEventName.textContent = `📍 ${localEvent.name}`;
    dashboardTitle.textContent = `📊 第 ${gameState.year} 年度 決算ダッシュボード`;

    let totalYearRevenue = 0;
    dashboardTableBody.innerHTML = ""; 

    gameState.landStrategies.forEach((strat, index) => {
        const crop = strat.crop;
        const market = strat.market;
        const assets = strat.assets;

        // crop または market が未定義の場合はスキップ（ID不一致バグの安全網）
        if (!crop || !market) {
            dashboardTableBody.innerHTML += `
                <tr>
                    <td style="font-weight:bold;">🗺️ ${index + 1}枚目</td>
                    <td colspan="6" style="color:#dc2626; font-weight:bold;">⚠️ 作物または販売先のデータが見つかりません</td>
                </tr>
            `;
            return;
        }

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

        let finalTechShortage = false;
        let totalFinalMultiplier = 0;
        let finalWorkerCount = 0;
        const hasFinalIT = assets.some(a => a.id === "it_system");

        let finalCropRankKey = "C";
        if (["corn", "daikon"].includes(crop.id)) finalCropRankKey = "B";
        if (["tomato", "strawberry", "japanese_parsley"].includes(crop.id)) finalCropRankKey = "A";
        if (["hakusai", "artichoke"].includes(crop.id)) finalCropRankKey = "S";

        strat.employees.forEach(e => {
            finalWorkerCount++;
            const empData = EMPLOYEE_MASTER.find(emp => emp.id === e.id);
            if (empData) {
                let workerRate = empData.rates[finalCropRankKey];
                if (hasFinalIT && empData.needIT[finalCropRankKey]) workerRate = 1.0;
                if (workerRate === 0.0) finalTechShortage = true;
                totalFinalMultiplier += workerRate;
            }
        });

        if (finalTechShortage) totalFinalMultiplier = 0;
        let avgFinalMultiplier = finalWorkerCount > 0 ? (totalFinalMultiplier / finalWorkerCount) : 0;
        let actualYieldKg = planYieldKg * yieldRate * avgFinalMultiplier;
        let hist = gameState.landHistory[index] || { lastFamily: null, consecutiveCounter: 0 };
        let tempCounter = hist.consecutiveCounter;
        
        if (hist.lastFamily === crop.family && hist.lastFamily !== null) tempCounter += 1;
        else tempCounter = 0;

        const hasFinalOrganic = assets.some(a => a.id === "organic");
        const hasFinalFertilizer = assets.some(a => a.id === "fertilizer");

        let replantMultiplier = 1.0;
        let replantLabel = "";
        
        if (tempCounter > 0) {
            if (hasFinalOrganic || (hasFinalIT && hasFinalFertilizer)) {
                // 回避成功
            } else {
                if (tempCounter === 1) { replantMultiplier = 0.8; replantLabel = "⚠️連作障害(軽)"; }
                else if (tempCounter === 2) { replantMultiplier = 0.4; replantLabel = "🚨連作障害(重)"; }
                else { replantMultiplier = 0.1; replantLabel = "☠️土壌崩壊"; }
            }
        }
        
        actualYieldKg = actualYieldKg * replantMultiplier;
        
        // 来年に向けて、確定した歴史を保存する（🚜🏠 資材の有効期限は保持したまま更新）
        gameState.landHistory[index] = {
            lastFamily: crop.family,
            consecutiveCounter: tempCounter,
            machineryExpireYear: hist.machineryExpireYear || null,
            greenhouseExpireYear: hist.greenhouseExpireYear || null
        };

        let techShortageLabel = finalTechShortage ? "⚠️技術不足で出荷不可" : "";
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

        // 💡 エラー防止のために、長すぎる行を安全に分割
        let extraInfoHtml = "";
        if (techShortageLabel !== "") {
            extraInfoHtml += `<br><span style="color:#dc2626; font-weight:bold;">${techShortageLabel}</span>`;
        } else {
            if (shieldStatus !== "") extraInfoHtml += `<br><span style="font-size:11px; color:#2e75b6;">${shieldStatus}</span>`;
            if (replantLabel !== "") extraInfoHtml += `<br><span style="color:#f59e0b; font-weight:bold; font-size:11px;">${replantLabel}</span>`;
        }
        if (market.id === 'direct_store') {
            extraInfoHtml += directStoreLotteryText;
        }

        dashboardTableBody.innerHTML += `
            <tr>
                <td style="font-weight:bold;">🗺️ ${index + 1}枚目</td>
                <td>${crop.name}<br><span style="font-size:11px; color:#64748b;">➔ ${market.name}</span></td>
                <td>${Math.round(planYieldKg).toLocaleString()} kg</td>
                <td class="${yieldClass}">${Math.round(actualYieldKg).toLocaleString()} kg ${extraInfoHtml}</td>
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

    if (!gameState.history) {
        gameState.history = [{ year: 0, money: 100000000, expense: 0, revenue: 0 }];
    }
    gameState.history.push({
        year: gameState.year,
        money: gameState.money,
        expense: currentYearExpenses,
        revenue: totalYearRevenue
    });

    // 💡 PDCA要因分析レポーティング
    const actualYearProfit = totalYearRevenue - currentYearExpenses;
    const gap = actualYearProfit - currentYearPlannedProfitSum;

    const gapEl = document.getElementById("reflect-gap");
    const globalReasonEl = document.getElementById("reflect-global-reason");
    const localReasonEl = document.getElementById("reflect-local-reason");

    if (gapEl) {
        if (gap > 0) {
            gapEl.innerHTML = `<span style="color: #16a34a; font-weight: bold;">計画より ＋${gap.toLocaleString()} 円 上振れ！(大成功です)</span><br><span style="font-size:11px; color:#64748b;">（計画見込利益: ${currentYearPlannedProfitSum.toLocaleString()}円 ➔ 実際の利益: ${actualYearProfit.toLocaleString()}円）</span>`;
        } else if (gap < 0) {
            gapEl.innerHTML = `<span style="color: #dc2626; font-weight: bold;">計画より －${Math.abs(gap).toLocaleString()} 円 下振れ！(リスク発生)</span><br><span style="font-size:11px; color:#64748b;">（計画見込利益: ${currentYearPlannedProfitSum.toLocaleString()}円 ➔ 実際の利益: ${actualYearProfit.toLocaleString()}円）</span>`;
        } else {
            gapEl.innerHTML = `<span style="color: #64748b; font-weight: bold;">±0 円（計画通りの完璧な采配です）</span>`;
        }
    }

    if (globalReasonEl) {
        if (globalEvent.id === "boom_exotic" || globalEvent.id === "boom_traditional") {
            globalReasonEl.textContent = `市場で【${globalEvent.name}】が発生。特定の作物の市場価格が2倍に高騰したため、対象作物を栽培していた場合は強力な追い風となりました。`;
        } else if (globalEvent.id === "bumper_crop") {
            globalReasonEl.textContent = `全国的な【${globalEvent.name}】により、一般的な作物の市場単価が50%に大暴落（豊作貧乏）。出荷量が多くても売上が伸び悩む原因となりました。`;
        } else if (globalEvent.id === "poor_crop") {
            globalReasonEl.textContent = `全国的な【${globalEvent.name}】により、市場価格が2倍に急高騰。自らの農地が被害を免れていた場合、莫大な売上を確保できるチャンス期でした。`;
        } else {
            globalReasonEl.textContent = `【通常気象】市場価格の突発的な変動はありません。純粋な作物の基礎単価と、事前の販売先選定戦略がそのまま利益を決定しました。`;
        }
    }

    if (localReasonEl) {
        if (localEvent.id === "pest" || localEvent.id === "disease" || localEvent.id === "heavy_rain" || localEvent.id === "bad_growth") {
            let isShielded = false;
            if (localEvent.id === "pest" && gameState.landStrategies.some(s => s.assets.some(a => a.id === "pesticide"))) isShielded = true;
            if (localEvent.id === "heavy_rain" && gameState.landStrategies.some(s => s.assets.some(a => a.id === "greenhouse"))) isShielded = true;
            if (localEvent.id === "bad_growth" && gameState.landStrategies.some(s => s.assets.some(a => a.id === "fertilizer"))) isShielded = true;

            localReasonEl.textContent = `地域に【${localEvent.name}】が発生し、作物の収穫量が大きく低下しました。${isShielded ? 'しかし、事前に導入していた防衛資材（施設や農薬など）が一部の農地で作物をガードしました。' : '資材・施設による防御が不足していた農地では、大きな機会損失（下振れ要因）となっています。'}`;
        } else if (localEvent.id === "animal_damage") {
            localReasonEl.textContent = `最悪の災害【${localEvent.name}】が発生。ハウス施設などの有無に関わらず、すべての作物が食い荒らされ収穫量が強制的に0kgとなりました。`;
        } else if (localEvent.id === "good_weather") {
            localReasonEl.textContent = `奇跡の【${localEvent.name}】が到来！全ての農地で収穫量が2倍に大ブーストされ、計画を大きく上回る収益をもたらした最大の要因です。`;
        } else {
            localReasonEl.textContent = `【特記事項なし】栽培トラブルは発生しませんでした。下振れがあるとすれば、従業員の技術レベル（C〜Sランク制限）が足りず、計画収量が最初から削られていた内部的な采配ミスが考えられます。`;
        }
    }
    // 🌟ここから追加：今年のPDCAデータを抽出し保存する
    let allAssets = [];
    let staffCount = 0;
    gameState.landStrategies.forEach(s => {
        if(s.assets) s.assets.forEach(a => { if(!allAssets.includes(a.name)) allAssets.push(a.name); });
        if(s.employees) staffCount += s.employees.length;
    });

    businessLogs.push({
        year: gameState.year,
        investments: allAssets,
        staffCount: staffCount,
        globalEvent: globalEvent.name,
        localEvent: localEvent.name,
        sales: totalYearRevenue,
        expense: currentYearExpenses,
        netProfit: actualYearProfit,
        // 要因分析のテキストを取得
        feedback: (gapEl ? gapEl.textContent : "") + "\n" + 
                  (globalReasonEl ? globalReasonEl.textContent : "") + "\n" + 
                  (localReasonEl ? localReasonEl.textContent : "")
    });

    const logDataToDB = {
        room_id: gameState.roomId,
        player_name: gameState.playerName,
        year: gameState.year,
        investments: allAssets.length > 0 ? allAssets.join('・') : 'なし',
        staff_count: staffCount,
        global_event: globalEvent.name,
        local_event: localEvent.name,
        sales: totalYearRevenue,
        expense: currentYearExpenses,
        net_profit: actualYearProfit,
        feedback: (gapEl ? gapEl.textContent : "") + " | " + 
                  (globalReasonEl ? globalReasonEl.textContent : "") + " | " + 
                  (localReasonEl ? localReasonEl.textContent : "")
    };

    supabaseClient.from('yearly_logs').insert([logDataToDB])
        .then(res => console.log("☁️ ログをサーバーへ自動送信しました"))
        .catch(err => console.error("送信エラー:", err));

    financialDashboard.classList.remove("hidden");
    endYearBtn.classList.add("hidden");
    nextYearPhaseBtn.classList.remove("hidden");
});

// --- 7. 次の年への移行フェーズ ---
nextYearPhaseBtn.addEventListener("click", () => {
    if (gameState.year >= 3) {
        gameContainer.classList.add("hidden");
        resultScreen.classList.remove("hidden");
        finalMoneyElement.textContent = gameState.money.toLocaleString();
        showFinalResult();
    } else {
        saveCurrentStrategies();
        gameState.year += 1;

        receivedGlobalEventId = null;
        receivedLocalEventId = null;

        generateLandStrategyUI(); 
        updateSetupFinancialBanner(); 

        gameContainer.classList.add("hidden");
        setupScreen.classList.remove("hidden");
        setTimeout(renderFinancialChart, 50);
    }
});

function saveCurrentStrategies() {
    const cards = landCardsContainer.querySelectorAll(".land-strategy-card");
    cards.forEach((card, idx) => {
        if (!gameState.landStrategies[idx]) {
            gameState.landStrategies[idx] = {};
        }
        
        const cropSel = card.querySelector(".land-crop-select");
        if (cropSel) gameState.landStrategies[idx].cropId = cropSel.value;

        const marketSel = card.querySelector(".land-market-select");
        if (marketSel) gameState.landStrategies[idx].marketId = marketSel.value;

        const workerSelects = card.querySelectorAll(".land-worker-select");
        let workerIds = [];
        workerSelects.forEach(sel => workerIds.push(sel.value));
        gameState.landStrategies[idx].employeeIds = workerIds;

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
        resultRankElement.textContent = "🏅 ランクＡ：敏腕グリーン経営者";
        resultCommentElement.textContent = `黒字を安定して確保し、近代的な営農スタイルを確立できています。さらに高みを目指しましょう！`;
    } else if (gameState.money >= 10000000) {
        resultRankElement.textContent = "🚜 ランクＢ：中堅ベテラン農家";
        resultCommentElement.textContent = `手堅い経営ですが、イベントの波に少し飲まれてしまったかもしれません。機材や人材への投資バランスを見直してみましょう。`;
    } else {
        resultRankElement.textContent = "🥀 ランクＣ：新米開拓農家";
        resultCommentElement.textContent = `資金が初期を下回ってしまいました。難易度の低い作物から始めたり、ITシステムでのカバーを試してみましょう！`;
    }

    finalMoneyElement.textContent = gameState.money.toLocaleString();

    gameContainer.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    setTimeout(() => {
        renderFinalSummaryChart();
    }, 50);

    supabaseClient.from('scores').insert([
        { 
            room_id: gameState.roomId,
            player_name: gameState.playerName, 
            final_money: gameState.money 
        }
    ]).then(response => {
        console.log("🏆 スコアの送信が完了しました！", response);
    }).catch(error => {
        console.error("スコア送信エラー:", error);
    });
}

// 📊 複合ダッシュボードグラフ
let financialChartInstance = null;
function renderFinancialChart() {
    const ctx = document.getElementById('financial-chart');
    if (!ctx) return;

    const labels = gameState.history.map(h => h.year === 0 ? "初期" : `第${h.year}年`);
    const moneyData = gameState.history.map(h => Math.round(h.money / 10000));
    const expenseData = gameState.history.map(h => Math.round(h.expense / 10000));
    const revenueData = gameState.history.map(h => Math.round(h.revenue / 10000));

    if (financialChartInstance) {
        financialChartInstance.destroy();
    }

    financialChartInstance = new Chart(ctx, {
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line',
                    label: '資金残高(万)',
                    data: moneyData,
                    borderColor: '#1e40af',
                    backgroundColor: '#1e40af',
                    borderWidth: 3,
                    tension: 0.1,
                    pointRadius: 4,
                    yAxisID: 'yMoney',
                    order: 1
                },
                {
                    type: 'bar',
                    label: '本年収益(万)',
                    data: revenueData,
                    backgroundColor: '#16a34a',
                    borderColor: '#16a34a',
                    borderWidth: 1,
                    yAxisID: 'yFlow',
                    order: 2
                },
                {
                    type: 'bar',
                    label: '本年費用(万)',
                    data: expenseData,
                    backgroundColor: '#dc2626',
                    borderColor: '#dc2626',
                    borderWidth: 1,
                    yAxisID: 'yFlow',
                    order: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 10, font: { size: 9 }, padding: 4 } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                yFlow: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: '本年収支 (万円)', font: { size: 8 } },
                    ticks: { font: { size: 8 } },
                    grid: { color: '#e2e8f0' }
                },
                yMoney: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: false,
                    title: { display: true, text: '総資金残高 (万円)', font: { size: 8 } },
                    ticks: { font: { size: 8 } },
                    grid: { display: false }
                },
                x: { ticks: { font: { size: 9 } }, grid: { display: false } }
            }
        }
    });
}

// 📊 最終総括グラフ
function renderFinalSummaryChart() {
    const ctx = document.getElementById('final-financial-chart');
    if (!ctx) return;

    const labels = gameState.history.map(h => h.year === 0 ? "初期" : `第${h.year}年`);
    const moneyData = gameState.history.map(h => Math.round(h.money / 10000));
    const expenseData = gameState.history.map(h => Math.round(h.expense / 10000));
    const revenueData = gameState.history.map(h => Math.round(h.revenue / 10000));

    new Chart(ctx, {
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line',
                    label: '資金残高(万)',
                    data: moneyData,
                    borderColor: '#1e40af',
                    backgroundColor: '#1e40af',
                    borderWidth: 3,
                    tension: 0.1,
                    pointRadius: 5,
                    yAxisID: 'yMoney',
                    order: 1
                },
                {
                    type: 'bar',
                    label: '本年収益(万)',
                    data: revenueData,
                    backgroundColor: '#16a34a',
                    borderColor: '#16a34a',
                    yAxisID: 'yFlow',
                    order: 2
                },
                {
                    type: 'bar',
                    label: '本年費用(万)',
                    data: expenseData,
                    backgroundColor: '#dc2626',
                    borderColor: '#dc2626',
                    yAxisID: 'yFlow',
                    order: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                yFlow: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: '本年収支 (万円)', font: { size: 10 } }
                },
                yMoney: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: false,
                    title: { display: true, text: '総資金残高 (万円)', font: { size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });
}

// ==========================================================================
// 🌟 追加：PDCAログ モーダル制御ロジック
// ==========================================================================
let businessLogs = [];

window.openLogModal = function() {
    document.getElementById('log-modal').style.display = 'flex';
    renderLogs();
};

window.closeLogModal = function() {
    document.getElementById('log-modal').style.display = 'none';
};

function renderLogs() {
    const container = document.getElementById('log-container');
    const emptyMsg = document.getElementById('empty-log-msg');
    
    if (businessLogs.length === 0) {
        emptyMsg.style.display = 'block';
        return;
    }
    
    emptyMsg.style.display = 'none';
    // 古い描画をクリア
    container.querySelectorAll('.log-card').forEach(el => el.remove());

    // 最新の年が上に来るように逆順でループ
    for (let i = businessLogs.length - 1; i >= 0; i--) {
        const log = businessLogs[i];
        const profitColor = log.netProfit >= 0 ? '#16a34a' : '#dc2626';
        
        const card = document.createElement('div');
        card.className = 'log-card';
        card.innerHTML = `
            <h3 style="margin-top:0; color:#1e40af; border-bottom:2px solid #cbd5e1; padding-bottom:5px;">📅 第 ${log.year} 年目の経営実績</h3>
            <div class="pdca-grid">
                <div class="pdca-block">
                    <strong>📝 投資・人員配置</strong>
                    <ul>
                        <li>導入した資材: ${log.investments.length > 0 ? log.investments.join(', ') : 'なし'}</li>
                        <li>雇用した従業員: 計 ${log.staffCount} 名</li>
                    </ul>
                </div>
                <div class="pdca-block">
                    <strong>🚜環境・発生イベント</strong>
                    <ul>
                        <li>全体環境: ${log.globalEvent}</li>
                        <li>局地環境: ${log.localEvent}</li>
                    </ul>
                </div>
                <div class="pdca-block" style="grid-column: span 2;">
                    <strong>📊 財務結果</strong>
                    <table style="width:100%; font-size:14px; text-align:left; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 4px;">売上高: ¥${log.sales.toLocaleString()}</td>
                            <td style="padding: 4px;">本年度費用: ¥${log.expense.toLocaleString()}</td>
                            <td style="padding: 4px; font-size: 16px;"><strong>純利益: <span style="color:${profitColor}">¥${log.netProfit.toLocaleString()}</span></strong></td>
                        </tr>
                    </table>
                </div>
                <div class="pdca-block" style="grid-column: span 2; background: #fdfae6; border-left: 4px solid #f59e0b;">
                    <strong>💡 システムによる要因分析</strong>
                    <p style="margin:5px 0 0 0; font-size:12px; line-height:1.6; color: #334155; white-space: pre-wrap;">${log.feedback}</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    }
}