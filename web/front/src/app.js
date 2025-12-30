import { state } from './modules/state.js';
import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

// --- Initialization ---

async function initApp() {
    ui.initDomElements();
    
    // Setup Initial Event Listeners
    window.showList = showList; // Used by back button

    // Load content
    showList();
}

// --- Logic Handlers ---

async function showList() {
    try {
        state.currentAnimations = await api.fetchAnimations();
    } catch (e) {
        console.error('Fetch error:', e);
        // Even if fetch fails, we want to show the list view (empty) so user can see buttons
        state.currentAnimations = [];
    } finally {
        ui.switchView(ui.elements.listView);
        renderCurrentList();
    }
}

function renderCurrentList() {
    ui.renderList(state, {
        onDetail: showDetail,
        onPageChange: (p) => {
            state.currentPage = p;
            renderCurrentList();
        }
    });
}

async function showDetail(aid) {
    try {
        const detail = await api.fetchAnimationDetail(aid);
        
        ui.elements.detailImage.src = detail.cover_path || detail.cover || 'https://via.placeholder.com/600x400?text=No+Image';
        ui.elements.detailTitle.innerText = detail.name;
        
        // 构建详细信息HTML
        let infoHtml = '';
        if (detail.company && detail.company.name) infoHtml += `<p><strong>制作公司:</strong> ${detail.company.name}</p>`;
        if (detail.season) infoHtml += `<p><strong>季度:</strong> ${detail.season}</p>`;
        if (detail.genres && detail.genres.length > 0) infoHtml += `<p><strong>类型:</strong> ${detail.genres.join(', ')}</p>`;
        if (detail.introduction) infoHtml += `<p><strong>简介:</strong> ${detail.introduction}</p>`;

        ui.elements.detailDesc.innerHTML = infoHtml;
        
        // 渲染角色信息
        if (ui.elements.characterGrid) {
            ui.elements.characterGrid.innerHTML = ''; // 清空之前的内容
            
            if (detail.characters && detail.characters.length > 0) {
                // 添加标题
                const charTitle = document.createElement('h3');
                charTitle.innerText = '角色信息';
                charTitle.style.marginTop = '20px';
                ui.elements.characterGrid.parentNode.insertBefore(charTitle, ui.elements.characterGrid);

                detail.characters.forEach(char => {
                    const charCard = document.createElement('div');
                    charCard.className = 'character-card';
                    charCard.style.display = 'flex';
                    charCard.style.alignItems = 'center';
                    charCard.style.marginBottom = '10px';
                    charCard.style.padding = '10px';
                    charCard.style.border = '1px solid #eee';
                    charCard.style.borderRadius = '4px';

                    const charImgSrc = char.cover_path || 'https://via.placeholder.com/50';
                    
                    let charInfo = `<strong>${char.name}</strong>`;
                    if (char.sex) charInfo += ` (${char.sex})`;
                    if (char.personality) charInfo += `<br>性格: ${char.personality}`;
                    
                    // CV 信息
                    if (char.voice_actor) {
                        charInfo += `<br>CV: ${char.voice_actor}`;
                        if (char.voice_actor_age) charInfo += ` (${char.voice_actor_age}岁)`;
                    }

                    charCard.innerHTML = `
                        <img src="${charImgSrc}" alt="${char.name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-right: 15px;">
                        <div>${charInfo}</div>
                    `;
                    ui.elements.characterGrid.appendChild(charCard);
                });
            } else {
                // 如果没有角色信息，移除可能存在的旧标题（简单处理，实际上init时清空更佳，这里假设每次重建）
                // 更好的做法是在HTML里放个容器专门装角色部分
            }
        }

        ui.switchView(ui.elements.detailView);
    } catch (e) {
        console.error('Fetch detail error:', e);
        alert('获取详情失败');
    }
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
