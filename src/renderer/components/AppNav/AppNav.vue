<template>
    <div class="appbar"
        :class="appbarDynamicClassName">
        <template v-if="!settings.windowBorder">
            <div v-if="!isDarwin"
                id="appbar-window-control">
                <mu-button icon
                    small
                    color="white"
                    @click="handleClose()">
                    <mu-icon value="close"
                        :size="16"></mu-icon>
                </mu-button>
                <mu-button icon
                    small
                    color="white"
                    @click="handleMaximize()">
                    <mu-icon value="keyboard_arrow_up"
                        :size="16"></mu-icon>
                </mu-button>
                <mu-button icon
                    small
                    color="white"
                    @click="handleMinimize()">
                    <mu-icon value="keyboard_arrow_down"
                        :size="16"></mu-icon>
                </mu-button>
            </div>
            <div id="appbar-drag-region"></div>
        </template>
        <mu-appbar title="Electron Netease Cloud Music"
            color="primary">
            <template #left>
                <mu-button icon
                    @click="drawerOpen = true">
                    <mu-icon value="menu"></mu-icon>
                </mu-button>
            </template>
            <template #right>
                <SearchBox></SearchBox>
            </template>
        </mu-appbar>
        <mu-drawer :width="300"
            :docked="false"
            :open.sync="drawerOpen"
            class="appbar-drawer">
            <div class="header"
                :style="backgroundUrlStyle">
                <mu-avatar :size="80">
                    <img v-if="user.loginValid"
                        :src="avatarUrl">
                    <mu-icon v-else
                        value="person"
                        :size="40"></mu-icon>
                </mu-avatar>
                <div class="text">
                    <span class="username"
                        @click="handleNameClick()">{{username}}</span>
                    <mu-button flat
                        v-if="user.loginValid"
                        class="btn-sign"
                        color="white"
                        :disabled="btnSignDisabled"
                        @click="handleSign()">
                        <mu-icon left
                            :value="btnSignIcon"
                            :size="16"></mu-icon>
                        <span>{{btnSignText}}</span>
                    </mu-button>
                </div>
            </div>
            <mu-list>
                <mu-list-item v-for="route in validRoutes"
                    button
                    :key="route.name"
                    @click="handleSideNav(route)">
                    <mu-list-item-action>
                        <mu-icon :value="route.icon || 'bug_report'"></mu-icon>
                    </mu-list-item-action>
                    <mu-list-item-title>{{route.title}}</mu-list-item-title>
                </mu-list-item>
            </mu-list>
        </mu-drawer>
        <LoginDialog :show.sync="loginDlgShow"></LoginDialog>
    </div>
</template>

<script>
import { mapActions } from 'vuex';

import Routes from '@/routes';
import SearchBox from './SearchBox.vue';
import LoginDialog from './LoginDialog.vue';
import { bkgImg, sizeImg, HiDpiPx } from '@/util/image';
import { isDarwin, browserWindow } from '@/util/globals';
import { UPDATE_SETTINGS, SET_USER_SIGN_STATUS } from '@/store/mutation-types';

const SignIcon = {
    [0b00]: 'radio_button_unchecked',
    [0b01]: 'contrast',
    [0b10]: 'contrast',
    [0b11]: 'check_circle'
};

export default {
    data() {
        return {
            isDarwin,
            drawerOpen: false,
            loginDlgShow: false
        };
    },
    computed: {
        /** @returns {import('@/store/modules/user').State}*/
        user() { return this.$store.state.user; },
        /** @returns {import('@/store/modules/settings').State}*/
        settings() { return this.$store.state.settings; },
        /** @returns {import('@/routes').Route[]} */
        validRoutes() {
            return Routes.filter(r => r.title);
        },
        /** @returns {string} */
        appbarDynamicClassName() {
            return {
                'is-darwin': this.isDarwin,
                'is-frameless': this.settings.windowBorder === false
            };
        },
        /** @returns {string} */
        avatarUrl() {
            return sizeImg(this.user.info.avatarUrl, HiDpiPx(80));
        },
        /** @returns {string} */
        username() {
            if (this.user.loginPending) return '登录中 ...';
            if (this.user.loginValid) return this.user.info.nickname;
            return '点击登录';
        },
        /** @returns {string} */
        backgroundUrlStyle() {
            return this.user.info.bkgUrl && bkgImg(sizeImg(this.user.info.bkgUrl, HiDpiPx(300), HiDpiPx(200)));
        },
        /** @returns {number} */
        signLevel() {
            let res = 0b00;
            if (this.user.signStatus.pcSign) res += 0b01;
            if (this.user.signStatus.mobileSign) res += 0b10;
            return res;
        },
        /** @returns {number} */
        btnSignDisabled() {
            return this.user.signPending || this.signLevel === 0b11;
        },
        /** @returns {string} */
        btnSignText() {
            if (this.signLevel === 0b11) return '已签到';
            return '未签到';
        },
        /** @returns {string} */
        btnSignIcon() {
            return SignIcon[this.signLevel];
        }
    },
    methods: {
        ...mapActions([
            'checkin'
        ]),
        handleClose() {
            browserWindow.close();
        },
        handleMinimize() {
            browserWindow.minimize();
        },
        handleMaximize() {
            browserWindow.maximize();
        },
        handleSideNav(route) {
            this.drawerOpen = false;
            if (route.name === this.$route.name) return;
            if (route.name === 'index') window.__NAV_BACK__ = true;
            if (this.$route.name === 'player') {
                this.$router.replace(route);
            } else {
                this.$router.push(route);
            }
        },
        handleNameClick() {
            if (!this.user.loginValid) {
                this.loginDlgShow = true;
            } else {
                this.handleSideNav({ name: 'profile' });
            }
        },
        async handleSign() {
            const points = await this.checkin();
            if (points > 0) {
                this.$toast.message(`签到成功，获得 ${points} 点积分`);
            } else {
                this.$toast.message('是不是已经签到过了呢 ：）');
            }
        }
    },
    created() {
        // register autoSign handler
        this.$store.subscribe(({ type, payload }, state) => {
            if (// settings.autoSign enabled
                (type === UPDATE_SETTINGS && payload && payload.autoSign === true) ||
                // signStatus updated via `actions.updateUserSignStatus`
                (type === SET_USER_SIGN_STATUS && payload && payload.timestamp)
            ) {
                const { timestamp, pcSign, mobileSign } = state.user.signStatus;
                // autoSign not enabled || signStatus was not up-to-date || signed already
                if (state.settings.autoSign !== true || timestamp < 0 || (pcSign && mobileSign)) return;
                this.handleSign();
            }
        });
    },
    components: {
        LoginDialog,
        SearchBox
    }
};
</script>

<style lang="less">
.appbar {
    &.is-frameless {
        .mu-appbar {
            padding-top: 16px;
        }
    }
    &.is-darwin {
        &.is-frameless {
            .mu-appbar {
                padding-top: 12px;
            }
        }
    }
    #appbar-window-control {
        z-index: 11;
        position: fixed;
        top: 0;
        left: 0;
        button {
            cursor: default !important;
            width: 28px;
            height: 28px;
        }
    }
    #appbar-drag-region {
        position: fixed;
        left: 84px;
        top: 2px;
        right: 60px;
        height: 62px;
        -webkit-app-region: drag;
    }
    .mu-appbar {
        user-select: none;
        z-index: 10;
        position: fixed;
        width: 100%;
        top: 0;
        left: 0;
        .mu-appbar-title {
            line-height: unset;
        }
    }
}

.appbar-drawer {
    border-radius: 0;
    user-select: none;
    .header {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        box-sizing: border-box;
        padding: 14px;
        width: 100%;
        height: 200px;
        background-size: cover;
        background-image: url('assets/img/bkg.svg');
        background-position-y: 50%;
        -webkit-app-region: no-drag;
        .text {
            margin-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.66));
            .username {
                color: white;
                font-size: 20px;
                cursor: pointer;
                line-height: 36px;
                width: 160px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .btn-sign.disabled {
                color: rgba(255, 255, 255, 0.7);
            }
        }
    }
}
</style>
