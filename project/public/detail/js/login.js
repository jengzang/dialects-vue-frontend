const { createApp, ref, defineComponent, onMounted ,watch ,computed} = window.Vue


function showAuthPopup() {
    // 👇 检查是否已经存在弹窗
    if (window.authPopupInstance) {
        // ❗先移除舊的
        window.authPopupInstance.unmount();
        const old = document.querySelector('.query-detail-panel');
        if (old) old.remove();
        window.authPopupInstance = null;
    }
    const container = document.createElement('div')
    document.body.appendChild(container)

    const AuthPopup = defineComponent({
        setup() {
            const mode = ref('login') // login | register | profile
            const username = ref('')
            const password = ref('')
            const email = ref('')

            const newUsername = ref('');  // 新用户名
            const currentPassword = ref('');  // 当前密码
            const newPassword = ref('');  // 新密码

            const error = ref('')
            const loading = ref(false)
            const user = ref(null)

            const modeType = ref('username'); // 默认显示修改用户名

            const close = () => {
                app.unmount()
                document.body.removeChild(container)
                window.authPopupInstance = null; // 👈 清除引用，允许下次打开
            }

            const validateEmail = (email) => {
                const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                return re.test(email);
            };

            const loginMode = ref('email') // 'email' | 'username'
            const showPassword = ref(false)

            const login = async () => {
                error.value = ''

                if (password.value.length < 6) {
                    error.value = '密碼不得少於 6 位'
                    return
                }

                loading.value = true

                try {
                    const form = new URLSearchParams()
                    if (loginMode.value === 'email') {
                        form.append('username', email.value)
                    } else {
                        form.append('username', username.value)
                    }
                    form.append('password', password.value)
                    const res = await api('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: form,
                    })

                    // 保存新的三个值
                    saveToken(res.access_token, res.refresh_token, res.expires_in)
                    await fetchUser()
                    window.userRole = undefined;
                    window.userRole = await getUserRole();
                    console.log(userRole)
                    error.value = '✅ 登錄成功<br>即將跳轉個人信息界面'
                    setTimeout(() => {
                        mode.value = 'profile'
                        error.value = ''
                    }, 1000)
                } catch (e) {
                    let msg = '未知錯誤';
                    // 情況 1：Error.message 是 JSON 字串：{"detail":"..."}
                    if (typeof e?.message === 'string') {
                        try {
                            const data = JSON.parse(e.message);
                            msg = data?.detail ?? e.message;
                        } catch {
                            // 不是 JSON，就直接顯示
                            msg = e.message;
                        }
                        // 情況 2：有些封裝會把 detail 掛在 err.detail 上
                    } else if (e && typeof e === 'object' && 'detail' in e) {
                        msg = e.detail;
                    }

                    // 你的自訂文案
                    if (msg.includes('Invalid credentials')) {
                        error.value = '用戶名不存在或密碼錯誤！';
                    } else {
                        error.value = msg; // ✅ 只顯示內容
                    }
                } finally {
                    loading.value = false  // ✅ 保證流程結束後可再次提交
                }
            }

            const register = async () => {
                error.value = ''

                // 驗證 email 與密碼
                if (!validateEmail(email.value)) {
                    error.value = '請輸入正確的郵箱'
                    return
                }
                if (password.value.length < 6) {
                    error.value = '密碼不得少於 6 位'
                    return
                }

                loading.value = true

                try {
                    const res = await api('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: username.value,
                            email: email.value,
                            password: password.value,
                        }),
                    })
                    error.value = '✅ 註冊成功，請登錄👤<br> ⏳ 兩秒後將自動跳轉到登錄頁面。'

                    // 延時 2 秒後，切換到個人資料界面
                    setTimeout(async () => {
                        mode.value = 'login'
                        error.value = ''
                    }, 2000);  // 延時 2 秒（2000 毫秒）

                } catch (e) {
                    const msg = e.message || ''
                    if (msg.includes('Username already exists')) {
                        error.value = '該用戶名已被佔用，請更換一個'
                    } else if (msg.includes('Email already exists')) {
                        error.value = '該郵箱已註冊，可直接登錄'
                    } else {
                        error.value = msg
                    }
                } finally {
                    loading.value = false  // ✅ 結束 loading，讓使用者可再次操作
                }
            }

            const logout = async () => {
                const refreshToken = getRefreshToken()

                try {
                    await api('/api/auth/logout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh_token: refreshToken })
                    })
                } catch {}

                clearToken()
                window.userRole = undefined;
                updateLoginUI(false);
                setTimeout(async () => {
                    mode.value = 'login'
                    error.value = ''
                }, 100);
            }

            const fetchUser = async () => {
                try {

                    const res = await api('/api/auth/me')
                    user.value = res
                    const isLoggedIn = res && res.id && res.username;
                    updateLoginUI(isLoggedIn, res?.username);
                } catch {
                    clearToken()
                    mode.value = 'login'
                }
            }

            const saveUsername = async () => {
                error.value = ''

                if (!newUsername.value) {
                    error.value = '請輸入新的用戶名'
                    return
                }

                loading.value = true

                try {
                    const form = new URLSearchParams();
                    form.append('username', newUsername.value);
                    // form.append('password', currentPassword.value);  // 当前密码用于验证
                    form.append('email', user.value.email);

                    const res = await api('/api/auth/updateProfile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: form,
                    })

                    error.value = '✅ 用戶名更新成功！<br>👤 您需重新登錄<br>⏳ 兩秒後將自動跳轉到登錄頁面。'

                    // 延時 2 秒後，切換到個人資料界面
                    setTimeout(async () => {
                        mode.value = 'profile';  // 切換到個人資料界面
                        await fetchUser();  // 獲取最新用戶數據
                        error.value = ''
                    }, 2000);  // 延時 2 秒（2000 毫秒）
                } catch (e) {
                    // 直接從 e.message 提取 detail 信息
                    try {
                        const errorDetails = JSON.parse(e.message);  // 解析 e.message 這個字符串
                        if (errorDetails.detail) {
                            error.value = `❌ 錯誤：${errorDetails.detail}`;  // 顯示 detail 信息
                        } else {
                            error.value = '發生未知錯誤';  // 如果没有 detail 字段，顯示默认錯誤
                        }
                    } catch (jsonError) {
                        error.value = '發生錯誤，無法解析響應';  // 如果 e.message 解析失败，顯示提示
                    }
                } finally {
                    loading.value = false
                }
            }

            const savePassword = async () => {
                error.value = ''

                if (!currentPassword.value) {
                    error.value = '請輸入當前密碼'
                    return
                }

                if (!newPassword.value || newPassword.value.length < 6) {
                    error.value = '新密碼必須至少6個字符'
                    return
                }

                loading.value = true

                try {
                    const form = new URLSearchParams();
                    // form.append('username', user.value.username);
                    form.append('password', currentPassword.value);  // 当前密码用于验证
                    form.append('new_password', newPassword.value);  // 新密码
                    form.append('email', user.value.email);

                    const res = await api('/api/auth/updateProfile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: form,
                    })

                    error.value = '✅ 密碼更新成功！<br>👤 ⏳ 兩秒後將自動跳轉到個人資料頁面。'

                    // 延時 2 秒後，切換到個人資料界面
                    setTimeout(async () => {
                        mode.value = 'profile';  // 切換到個人資料界面
                        await fetchUser();  // 獲取最新用戶數據
                        error.value = ''
                    }, 2000);  // 延時 2 秒（2000 毫秒）
                } catch (e) {
                    // 直接從 e.message 提取 detail 信息
                    try {
                        const errorDetails = JSON.parse(e.message);  // 解析 e.message 這個字符串
                        if (errorDetails.detail) {
                            error.value = `❌ 錯誤：${errorDetails.detail}`;  // 顯示 detail 信息
                        } else {
                            error.value = '發生未知錯誤';  // 如果没有 detail 字段，顯示默认錯誤
                        }
                    } catch (jsonError) {
                        error.value = '發生錯誤，無法解析響應';  // 如果 e.message 解析失败，顯示提示
                    }
                }finally {
                    loading.value = false
                }
            }

            const queryStats = computed(() => {
                const stats = user.value?.usage_summary || []

                const labelMap = {
                    '/api/phonology': '🔍 查地位',
                    '/api/search_chars/': '🔤 查字',
                    '/api/search_tones/': '🎶 查調',
                }

                let total = 0
                const filtered = stats
                    .filter(stat => Object.keys(labelMap).includes(stat.path))
                    .map(stat => {
                        total += stat.count
                        return {
                            label: labelMap[stat.path],
                            count: stat.count
                        }
                    })

                return {
                    total,
                    items: filtered
                }
            })

            onMounted(async () => {
                if (getToken()) {
                    await fetchUser()
                    if (user.value) {
                        mode.value = 'profile'
                        // console.log("👀 User 內容：", user.value)
                    }
                }
            })

            // ✅ 格式化為北京時間（UTC+8）
            const fmt = (isoStr) => {
                const utc = new Date(isoStr)
                const beijing = new Date(utc.getTime() + 8 * 60 * 60 * 1000)
                return beijing.toLocaleString('zh-Hant-CN', { hour12: false })
            }

            const formatOnlineTime = (seconds) => {
                if (!seconds || isNaN(seconds)) return '-'
                const hours = Math.floor(seconds / 3600)
                const minutes = Math.floor((seconds % 3600) / 60)
                return `${hours} 小時 ${minutes} 分鐘`
            }

            const goToAdminPanel = () => {
                    window.location.href = window.WEB_BASE + '/admin';  // 跳转到后台管理页面
            };


            watch(mode, () => {
                error.value = ''
            })


            return {
                username, password, email, error, loading,savePassword,saveUsername,modeType,
                user, mode, login, register, logout, close, fmt,loginMode,newPassword,newUsername,currentPassword,
                formatOnlineTime,showPassword,queryStats,goToAdminPanel // 👈 新增這行
            }

        },
        template: `
          <div class="query-detail-panel" @click.self="close">
            <button class="popup-close" @click="close" style="position:absolute;top:8px;right:12px;font-size:20px;
        background:none;border:none;cursor:pointer;overflow: hidden;text-overflow: ellipsis;white-space: nowrap">×
            </button>

            <!-- 登錄介面 -->
            <div v-if="mode === 'login'" style="padding: 12px; text-align: center;">
              <h3>登錄</h3>

              <!-- Tab 切換 -->
              <div class="login-tabs">
                <button
                    @click="loginMode = 'email'"
                    :class="{ active: loginMode === 'email' }"
                >📧 使用郵箱
                </button>

                <button
                    @click="loginMode = 'username'"
                    :class="{ active: loginMode === 'username' }"
                >👤 使用用戶名
                </button>
              </div>
              
              <!-- 郵箱登入 -->
              <div v-if="loginMode === 'email'">
                <div class="form-row" style="display: flex; justify-content: center;">
                  <input
                      v-model="email"
                      placeholder="郵箱"
                      style="padding-right: 2em;"
                  />
                  <span
                      style="
                  position: absolute;
                  right: 15px;
                  top: 50%;
                  transform: translateY(-50%);
                  color: transparent;
                  font-size: 16px;
                  pointer-events: none;
                "
                  >📧</span>
                </div>
                <div class="form-row" style="display: flex; justify-content: center;position: relative">
                  <input
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="密碼"
                      style="padding-right: 2em;"
                  />
                  <span
                      @click="showPassword = !showPassword"
                      style="
                  position: absolute;
                  right: 15px;  /* 🎯 調整這個來精準對齊 input 內右邊 */
                  top: 50%;
                  transform: translateY(-50%);
                  cursor: pointer;
                  user-select: none;
                  font-size: 16px;
                ">
                {{ showPassword ? '👁️' : '🙈' }}
              </span>
                </div>
              </div>

              <!-- 用戶名登入 -->
              <div v-else>
                <div class="form-row" style="display: flex; justify-content: center;">
                  <input
                      v-model="username"
                      placeholder="用戶名"
                      style="padding-right: 2em;"
                  />
                  <span
                      style="
                  position: absolute;
                  right: 15px;
                  top: 50%;
                  transform: translateY(-50%);
                  color: transparent;
                  font-size: 16px;
                  pointer-events: none;
                "
                  >👤</span>
                </div>
                <div class="form-row" style="display: flex; justify-content: center; position: relative;">
                  <input
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="密碼"
                      style="padding-right: 2em;"
                  />
                  <span
                      @click="showPassword = !showPassword"
                      style="
                          position: absolute;
                          right: 15px;  /* 🎯 調整這個來精準對齊 input 內右邊 */
                          top: 50%;
                          transform: translateY(-50%);
                          cursor: pointer;
                          user-select: none;
                          font-size: 16px;
                        ">
                        {{ showPassword ? '👁️' : '🙈' }}
                  </span>
                </div>
              </div>

              <div class="form-row" style="display: flex; justify-content: center;">
                <button class="btn-search" @click="login" :disabled="loading">登入</button>
              </div>
              <p v-if="error" class="err" v-html="error"></p>
              <p><a href="#" @click.prevent="mode='register'">沒有帳號？註冊一個</a></p>
            </div>

            <!-- 註冊介面 -->
            <div v-else-if="mode === 'register'" style="padding: 12px; text-align: center;">
              <h3>註冊</h3>
              <div class="form-row" style="display: flex; justify-content: center;">
                <input
                    v-model="username"
                    placeholder="用戶名"
                    style="padding-right: 2em;"
                />
                <span
                    style="
                  position: absolute;
                  right: 15px;
                  top: 50%;
                  transform: translateY(-50%);
                  color: transparent;
                  font-size: 16px;
                  pointer-events: none;
                "
                >👤</span>
              </div>
              <div class="form-row" style="display: flex; justify-content: center;">
                <input
                    v-model="email"
                    placeholder="郵箱"
                    style="padding-right: 2em;"
                />
                <span
                    style="
                  position: absolute;
                  right: 15px;
                  top: 50%;
                  transform: translateY(-50%);
                  color: transparent;
                  font-size: 16px;
                  pointer-events: none;
                "
                >📧</span>
              </div>
              <div class="form-row" style="display: flex; justify-content: center; position: relative;">
                <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="密碼"
                    style="padding-right: 2em;"
                />
                <span
                    @click="showPassword = !showPassword"
                    style="
                  position: absolute;
                  right: 15px;  /* 🎯 調整這個來精準對齊 input 內右邊 */
                  top: 50%;
                  transform: translateY(-50%);
                  cursor: pointer;
                  user-select: none;
                  font-size: 16px;
                ">
                {{ showPassword ? '👁️' : '🙈' }}
              </span>
              </div>
              <div class="form-row" style="display: flex; justify-content: center;">
                <button class="btn-search" @click="register" :disabled="loading">註冊</button>
              </div>
              <p v-if="error" class="err" v-html="error"></p>
              <p><a href="#" @click.prevent="mode='login'">已有帳號？登錄</a></p>
            </div>

            <!-- 🎉 Profile 歡迎彈窗 -->
            <div
                v-if="mode === 'profile' && user"
                style="padding: 12px; text-align: center;"
            >
              <h3 id="login-title" style="font-size: 30px; white-space: nowrap">👋 歡迎回來，{{ user.username }}！✨</h3>
              <p id="login-info" style="font-size: 20px">
                {{ user?.role === 'admin' ? '🛡️ 您是管理員' : '👤 您是普通用戶' }}
              </p>
              <p id="login-info" style="font-size: 20px">🗓️ 註冊時間：{{ fmt(user.created_at) }}</p>
              <p id="login-info" style="font-size: 20px">⏱️ 總在線時長：
                {{ formatOnlineTime(user.total_online_seconds) }}</p>
              <p id="login-info" style=" font-size: 20px;">
                📊 總查詢次數：<span style="color: #cd0b0b;margin-bottom: 0;">{{ queryStats.total }}</span> 次
              </p>
              <ul class="api-log-list">
                <li
                    v-for="item in queryStats.items"
                    :key="item.label"
                    class="api-log-item"
                >
                  -- {{ item.label }}：{{ item.count }} 次
                </li>
              </ul>
              <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
                <!-- 退出登录按钮 -->
                <button class="btn-search" @click="logout" style="margin-top: 10px; display: flex;
                 justify-content: center; gap: 10px;background: #9a2118">退出登錄</button>
                <!-- 修改资料按钮 -->
                <button class="btn-search" @click="mode = 'modifyProfile'" style="margin-top: 10px; display: flex;
                 justify-content: center; gap: 10px;">修改資料</button>
                <!-- 后台管理按钮 -->
                <div v-if="user?.role === 'admin'" style="margin-top: 10px; display: flex;justify-content: center; gap: 10px; ">
                  <button class="btn-search" @click="goToAdminPanel" style="background: #4CAF50">後台管理</button>
                </div>

              </div>

            </div>

            <!-- 修改资料界面 -->
            <div v-else-if="mode === 'modifyProfile'" style="padding: 12px; text-align: center;">
              <h3>欢迎 {{ user.username }}! 🎉😊</h3> <!-- 欢迎信息，加入 emoji -->

              <!-- Tab 切换部分 -->
              <div class="login-tabs">
                <button
                    @click="modeType = 'username'" :disabled="loading"
                    :class="{ active: modeType === 'username' }"
                >👤 修改用戶名</button>

                <button
                    @click="modeType = 'password'" :disabled="loading"
                    :class="{ active: modeType === 'password' }"
                >🔒 修改密碼</button>
              </div>
              
              <!-- 修改用户名部分 -->
              <div  v-if="modeType === 'username'">
                  <div class="form-row" style="display: flex; justify-content: center;">
                    <input
                        v-model="newUsername"
                        :placeholder="'請輸入新用戶名'"
                        style="padding-right: 2em;"
                    />
                    <span
                        style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: transparent; font-size: 16px; pointer-events: none;">
                      👤
                    </span>
                  </div>
                  <div class="form-row" style="display: flex; justify-content: center;">
                    <!-- 保存用户名按钮 -->
                    <button class="btn-search" @click="saveUsername" :disabled="loading">保存用戶名</button>
                  </div>
              </div>

              <!-- 修改密码部分 -->
              <div v-if="modeType === 'password'">
                <!-- 验证原密码 -->
                <div class="form-row" style="display: flex; justify-content: center;">
                  <input
                      v-model="currentPassword"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="請輸入當前密碼"
                      style="padding-right: 2em;"
                  />
                </div>

                <!-- 修改密码 -->
                <div class="form-row" style="display: flex; justify-content: center;">
                  <input
                      v-model="newPassword"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="請輸入新密碼（至少6個字符）"
                      style="padding-right: 2em;"
                  />
                </div>
                
                <span
                    @click="showPassword = !showPassword"
                    style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; user-select: none; font-size: 16px;">
                    {{ showPassword ? '👁️' : '🙈' }}
                </span>
                
                <div v-if="modeType === 'password'" class="form-row" style="display: flex; justify-content: center;">
                  <!-- 保存密码按钮 -->
                  <button class="btn-search" @click="savePassword" :disabled="loading">保存新密碼</button>
                </div>
              </div>

              <p v-if="error" class="err" v-html="error"></p>
              <!-- 返回按钮 -->
              <div class="form-row" style="justify-content: center; margin-top: 10px;">
                <button class="btn-search" @click="mode = 'profile'" style="background: darkgoldenrod">返回</button>
              </div>
            </div>



          </div>
        `
    })

    const app = createApp(AuthPopup)
    app.mount(container)
    // ✅ 記住當前彈窗
    window.authPopupInstance = app;

    // ✅ 顯示面板 + 居中 + 自適應大小（不改 CSS）
    setTimeout(() => {
        const panel = container.querySelector('.query-detail-panel')
        if (panel) {
            panel.style.display = 'flex'
            panel.style.left = '50%'
            panel.style.top = '50%'
            panel.style.transform = 'translate(-50%, -50%)'
            panel.style.width = 'auto'
            panel.style.height = 'auto'
            panel.style.maxWidth = '90vw'
            panel.style.maxHeight = '90vh'
            panel.style.alignItems = 'center'
            panel.style.justifyContent = 'center'
            // ✅ 添加呼吸邊框動畫
            panel.classList.add('border-breath');
            // 🧹 動畫播放完移除 class，避免干擾下次動畫觸發
            setTimeout(() => {
                panel.classList.remove('border-breath');
            }, 1600);
        }
    }, 0)
}

// ✅ 將函數掛到全局，可直接 onclick="showAuthPopup()"
window.showAuthPopup = showAuthPopup

//登錄請求api
const getToken = () => {
    let token = localStorage.getItem('access_token');
    if (!token) {
        token = getCookie('access_token');
    }
    // 兼容旧版本
    if (!token) {
        token = localStorage.getItem('ACCESS_TOKEN');
    }
    return token;
}

const getRefreshToken = () => {
    let token = localStorage.getItem('refresh_token');
    if (!token) {
        token = getCookie('refresh_token');
    }
    return token;
}

const getTokenExpiresAt = () => {
    const expiresAt = localStorage.getItem('token_expires_at');
    return expiresAt ? parseInt(expiresAt) : null;
}

// 讀取 Cookie 函數
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null; // 如果 Cookie 中找不到該名稱的項目
};


const saveToken = (accessToken, refreshToken = null, expiresIn = 1800) => {
    if (!refreshToken) {
        // 旧版本调用，只传一个参数
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('ACCESS_TOKEN', accessToken);  // 兼容
        document.cookie = `access_token=${accessToken}; path=/; secure; samesite=None`;
        document.cookie = `ACCESS_TOKEN=${accessToken}; path=/; secure; samesite=None`;
        return;
    }

    // 存储 access token
    localStorage.setItem('access_token', accessToken);

    // 存储 refresh token
    localStorage.setItem('refresh_token', refreshToken);

    // 存储过期时间戳（当前时间 + expiresIn秒）
    const expiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem('token_expires_at', expiresAt.toString());

    // 同时存到 Cookie（可选，保持兼容）
    document.cookie = `access_token=${accessToken}; path=/; secure; samesite=None`;
    document.cookie = `refresh_token=${refreshToken}; path=/; secure; samesite=None`;
}

const clearToken = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');

    // 清除旧版本的 key（兼容）
    localStorage.removeItem('ACCESS_TOKEN');
    localStorage.removeItem('TOKEN_EXP');

    // 删除 cookie 中的 token（需要和设置时的 path 一致）
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=None';
    document.cookie = 'ACCESS_TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=None';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=None';
    document.cookie = 'TOKEN_EXP=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=None';
}

/**
 * 刷新 Access Token
 * @returns {Promise<string|null>} 新的 access token，失败返回 null
 */
async function refreshAccessToken() {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        console.warn('没有 refresh token，无法刷新');
        return null;
    }

    try {
        const WEB_BASE = window.WEB_BASE || 'http://localhost:5000';

        const res = await fetch(WEB_BASE + '/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!res.ok) {
            // refresh token 过期或无效
            console.error('刷新 token 失败:', res.status);
            clearToken();
            return null;
        }

        const data = await res.json();

        // 保存新的 tokens
        saveToken(data.access_token, data.refresh_token, data.expires_in);

        console.log('✅ Token 刷新成功');
        return data.access_token;

    } catch (error) {
        console.error('刷新 token 异常:', error);
        clearToken();
        return null;
    }
}

async function api(path, { method = 'GET', headers = {}, body = null } = {}) {
    const WEB_BASE = window.WEB_BASE || 'http://localhost:5000'

    let token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`

    try {
        let res = await fetch(WEB_BASE + path, { method, headers, body })

        // ===== 核心改动：401 时尝试刷新并重试 =====
        if (res.status === 401) {
            console.log('收到 401，尝试刷新 token...');
            const newToken = await refreshAccessToken();

            if (newToken) {
                // 用新 token 重试请求
                headers['Authorization'] = `Bearer ${newToken}`;
                res = await fetch(WEB_BASE + path, { method, headers, body });
            } else {
                // refresh token 也失效了，跳转登录
                if (typeof showAuthPopup === 'function') {
                    showAuthPopup();
                }
            }
        }
        // =========================================

        if (!res.ok) {
            const text = await res.text()
            throw new Error(text || `請求失敗：${res.status}`)
        }

        const ct = res.headers.get('content-type') || ''
        return ct.includes('application/json') ? res.json() : res.text()

    } catch (error) {
        // 如果最终还是 401，清除 token
        if (error.status === 401) {
            clearToken();
        }
        throw error
    }
}


/**
 * 驗證當前用戶是否已登入
 * @param {Event} [e] - 點擊事件，可選。如果傳入會自動 preventDefault/stopPropagation
 * @param popup_bool - 是否顯示彈窗
 * @returns {Promise<false | { id: string|number, username: string }>}
 *          - false = 未登入（事件已攔截，並彈出提示）
 *          - {id, username} = 已登入，用戶資訊
 */
async function ensureAuthenticated(e,popup_bool = true) {
    try {
        const res = await api('/api/auth/me');
        if (res && res.id && res.username) {
            // ✅ 已登入 → 返回用戶信息
            return { id: res.id, username: res.username };
        }
    } catch (err) {
        if (err.status === 401) {
            clearToken();  // 明確知道是 token 無效才清掉
        }
    }
    // ❌ 未登入 → 攔截事件
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (popup_bool) {// 提示登入
        showAuthPopup();
    }
    return false;
}

async function update_userdatas_bytoken(token,console_log = false) {
    try {
        const userRes = await fetch(`${window.WEB_BASE}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (console_log) {
            if (userRes.ok) {
                const userData = await userRes.json();
                window.currentUser = userData;
                // console.log("✅ 用戶資料已更新", userData);
                return userData; // 可選：回傳資料供外部使用
            } else {
                console.warn("⚠️ /auth/me 回傳非 200 狀態");
                return null;
            }
        }
    } catch (err) {
        console.error("❌ 無法更新用戶資料", err);
        return null;
    }
}

function updateLoginUI(isLoggedIn, username = '') {
    const loginBtn = document.getElementById('login');
    const loginTip = document.getElementById('login-tip');

    if (isLoggedIn) {
        loginBtn.textContent = '已登录';
        loginBtn.classList.add('logged-in');
        loginBtn.classList.remove('logged-out');
        loginTip.textContent = `${username} 歡迎🥳`;
    } else {
        loginBtn.textContent = '登录';
        loginBtn.classList.add('logged-out');
        loginBtn.classList.remove('logged-in');
        loginTip.textContent = '此功能需登錄使用';
    }
}

