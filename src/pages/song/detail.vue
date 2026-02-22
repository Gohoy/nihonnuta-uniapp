<script lang="ts" setup>
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { getProcessedNeteaseLyricById, getProcessedSongById, playSong, getSongById, getSongAudioUrl, getSongVocabulary } from '@/api/songs'
import { submitSuggestion } from '@/api/suggestions'
import { recordLearning } from '@/api/learning'
import { addWordToBook } from '@/api/wordbook'
import { addGrammarToBook } from '@/api/grammarbook'
import { useUserStore } from '@/store/user'
import { useTTS } from '@/hooks/useTTS'
import { http } from '@/http/http'
import { getNeteaseLoginStatus, getNeteaseQRKey, getNeteaseQRCode, checkNeteaseQRStatus, downloadSongAudio } from '@/api/neteaseLogin'

definePage({
  style: {
    navigationBarTitleText: '歌词学习',
  },
})

interface Token {
  token_id: number
  text: string
  kana: string
  base_form: string
  pos: string
  pos_detail: string
  furigana: any[]
  furigana_html: string
  has_kanji: boolean
  tags?: string[]
  meaning?: string
}

interface LyricLine {
  time?: number
  time_str?: string
  original: string
  kana?: string
  furigana_html: string
  tokens: Token[]
  translate?: string
  roma?: string
  grammar?: any[]
}

const songId = ref<string>('')
const source = ref<string>('local')
const songName = ref<string>('')
const singer = ref<string>('')
const coverUrl = ref<string>('')
const loading = ref(true)
const error = ref('')
const lyrics = ref<LyricLine[]>([])
const showTranslate = ref(true)
const showRoma = ref(false)
const showGrammar = ref(true)
const showFurigana = ref(true)
const selectedToken = ref<Token | null>(null)
const selectedLineIndex = ref<number>(-1)
const showWordDetail = ref(false)
const addingWord = ref(false)
const userStore = useUserStore()
const { playWord, playingWord, loadingWord } = useTTS()

// Song creator state
const songCreator = ref('')
const isCreator = computed(() => userStore.userInfo?.userId === songCreator.value)
const isAdmin = computed(() => userStore.userInfo?.isAdmin === true)

// Netease login & audio download state
const showQRLogin = ref(false)
const qrImg = ref('')
const qrKey = ref('')
const qrStatus = ref('')
const neteaseNickname = ref('')
const downloadingAudio = ref(false)
let qrPollTimer: any = null

async function handleDownloadAudio() {
  if (!songId.value) return
  // Check netease login status first
  try {
    const status: any = await getNeteaseLoginStatus()
    if (!status?.loggedIn) {
      startQRLogin()
      return
    }
    neteaseNickname.value = status.nickname || ''
  } catch {
    startQRLogin()
    return
  }
  // Download audio
  doDownloadAudio()
}

async function doDownloadAudio() {
  downloadingAudio.value = true
  try {
    await downloadSongAudio(songId.value)
    uni.showToast({ title: '音频下载成功', icon: 'success' })
    // Destroy old audio and fetch fresh URL bypassing all caches
    destroyAudio()
    const ts = Date.now()
    const res: any = await http.get(`/songs/${songId.value}/audio`, { _t: ts })
    if (res?.url) {
      // Also bust browser audio cache by appending timestamp to audio URL
      const sep = res.url.includes('?') ? '&' : '?'
      audioUrl.value = res.url + sep + '_t=' + ts
      hasAudio.value = true
      initAudio()
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || '下载失败', icon: 'none' })
  } finally {
    downloadingAudio.value = false
  }
}

async function startQRLogin() {
  qrStatus.value = '加载中...'
  showQRLogin.value = true
  try {
    const keyRes: any = await getNeteaseQRKey()
    qrKey.value = keyRes?.key
    const imgRes: any = await getNeteaseQRCode(qrKey.value)
    qrImg.value = imgRes?.qrimg || ''
    qrStatus.value = '请使用网易云音乐APP扫码'
    startQRPoll()
  } catch {
    qrStatus.value = '获取二维码失败'
  }
}

function startQRPoll() {
  stopQRPoll()
  qrPollTimer = setInterval(async () => {
    try {
      const res: any = await checkNeteaseQRStatus(qrKey.value)
      const code = res?.code
      if (code === 803) {
        qrStatus.value = '登录成功'
        stopQRPoll()
        showQRLogin.value = false
        uni.showToast({ title: '网易云登录成功', icon: 'success' })
        doDownloadAudio()
      } else if (code === 802) {
        qrStatus.value = '已扫码，请在手机上确认'
      } else if (code === 800) {
        qrStatus.value = '二维码已过期'
        stopQRPoll()
      }
    } catch {}
  }, 2000)
}

function stopQRPoll() {
  if (qrPollTimer) { clearInterval(qrPollTimer); qrPollTimer = null }
}

// Edit suggestion state
const showEditPopup = ref(false)
const editLineIndex = ref(-1)
const editTimeMs = ref(0)
const editOriginal = ref('')
const editTranslate = ref('')
const editRoma = ref('')
const editReason = ref('')
const submittingEdit = ref(false)
const editOriginalOld = ref('')
const editTranslateOld = ref('')
const editRomaOld = ref('')

// Kana edit state (per-token readings)
interface KanaEdit {
  text: string
  kana: string
  originalKana: string
  hasKanji: boolean
}
const editKanaList = ref<KanaEdit[]>([])

// Grammar popup state
const showGrammarPopup = ref(false)
const selectedGrammar = ref<any>(null)
const selectedGrammarLine = ref<LyricLine | null>(null)
const addingGrammar = ref(false)

// Audio re-upload state
const reUploading = ref(false)

// Pre-study vocabulary state
const showPreStudy = ref(false)
const preStudyWords = ref<any[]>([])
const preStudyGrouped = ref<Record<string, any[]>>({})
const preStudyMasteredCount = ref(0)
const currentPreStudyIndex = ref(0)
const showPreStudyMeaning = ref(false)
const preStudyMode = ref<'list' | 'card'>('list')
const preStudyActiveLevel = ref('')
const addingPreStudyWord = ref<string | null>(null)

// Audio player state
const audioUrl = ref('')
const hasAudio = ref(false)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const currentLineIndex = ref(-1)
let audioContext: any = null
let timeUpdateTimer: any = null
let lastTimeUpdate = 0

async function loadAudioUrl() {
  if (!songId.value) return
  // Check for local audio override (user uploaded but pending approval)
  try {
    const overrides = JSON.parse(uni.getStorageSync('audioOverrides') || '{}')
    if (overrides[songId.value]) {
      audioUrl.value = overrides[songId.value]
      hasAudio.value = true
      return
    }
  } catch {}
  try {
    const res: any = await getSongAudioUrl(songId.value)
    if (res?.url) {
      audioUrl.value = res.url
      hasAudio.value = true
    }
  } catch {
    hasAudio.value = false
  }
}

function initAudio() {
  if (!audioUrl.value) return

  // #ifdef H5
  // Use native Audio API on H5 for better performance
  const audio = new Audio(audioUrl.value)
  audio.preload = 'auto'
  audio.addEventListener('canplay', () => {
    duration.value = audio.duration || 0
  })
  audio.addEventListener('ended', () => {
    isPlaying.value = false
    currentLineIndex.value = -1
  })
  audio.addEventListener('error', () => {
    isPlaying.value = false
    hasAudio.value = false
  })
  // Throttled time update via polling (4 times/sec)
  const pollInterval = setInterval(() => {
    if (!audio.paused) {
      currentTime.value = audio.currentTime || 0
      if (!duration.value) duration.value = audio.duration || 0
      updateCurrentLine()
    }
  }, 250)
  audioContext = {
    play() { audio.play().catch(() => {}) },
    pause() { audio.pause() },
    seek(t: number) { audio.currentTime = t },
    stop() { audio.pause(); audio.currentTime = 0 },
    destroy() { audio.src = ''; clearInterval(pollInterval) },
    get duration() { return audio.duration || 0 },
    get currentTime() { return audio.currentTime || 0 },
    set src(v: string) { audio.src = v },
  }
  return
  // #endif

  // Non-H5: use uni API
  audioContext = uni.createInnerAudioContext()
  audioContext.src = audioUrl.value
  audioContext.onCanplay(() => {
    duration.value = audioContext.duration || 0
  })
  audioContext.onTimeUpdate(() => {
    // Throttle to ~4 updates/sec
    const now = Date.now()
    if (now - lastTimeUpdate < 250) return
    lastTimeUpdate = now
    currentTime.value = audioContext.currentTime || 0
    duration.value = audioContext.duration || 0
    updateCurrentLine()
  })
  audioContext.onEnded(() => {
    isPlaying.value = false
    currentLineIndex.value = -1
  })
  audioContext.onError(() => {
    isPlaying.value = false
    hasAudio.value = false
  })
}

function togglePlay() {
  if (!audioContext) return
  if (isPlaying.value) {
    audioContext.pause()
    isPlaying.value = false
  } else {
    audioContext.play()
    isPlaying.value = true
  }
}

function playFromLine(index: number) {
  if (!audioContext) return
  const line = lyrics.value[index]
  if (line?.time == null) return
  audioContext.seek(line.time / 1000)
  audioContext.play()
  isPlaying.value = true
}

function pauseAudio() {
  if (!audioContext) return
  audioContext.pause()
  isPlaying.value = false
}

function seekTo(e: any) {
  if (!audioContext || !duration.value) return
  const ratio = e.detail?.value / 100 || 0
  const time = ratio * duration.value
  audioContext.seek(time)
  currentTime.value = time
}

// Binary search for current lyric line based on time (ms)
function updateCurrentLine() {
  if (!lyrics.value.length) return
  const timeMs = currentTime.value * 1000
  let lo = 0
  let hi = lyrics.value.length - 1
  let result = -1

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const lineTime = lyrics.value[mid].time
    if (lineTime === undefined || lineTime === null) {
      // No time data — skip binary search
      return
    }
    if (lineTime <= timeMs) {
      result = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  if (result !== currentLineIndex.value) {
    currentLineIndex.value = result
  }
}

function scrollToCurrentLine() {
  if (currentLineIndex.value < 0) return
  const query = uni.createSelectorQuery()
  query.select(`#lyric-line-${currentLineIndex.value}`).boundingClientRect()
  query.select('.lyrics-scroll-container').boundingClientRect()
  query.select('.lyrics-scroll-container').scrollOffset()
  query.exec((res: any) => {
    if (!res[0] || !res[1] || !res[2]) return
    const lineTop = res[0].top
    const containerTop = res[1].top
    const containerHeight = res[1].height
    const scrollTop = res[2].scrollTop
    const targetScroll = scrollTop + lineTop - containerTop - containerHeight / 3
    // Use uni API for smooth scroll
    uni.pageScrollTo({
      scrollTop: Math.max(0, targetScroll),
      duration: 200,
    })
  })
}

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function destroyAudio() {
  if (audioContext) {
    audioContext.stop()
    audioContext.destroy()
    audioContext = null
  }
  if (timeUpdateTimer) {
    clearInterval(timeUpdateTimer)
    timeUpdateTimer = null
  }
}

async function loadLyrics() {
  if (!songId.value) {
    error.value = '缺少歌曲 ID'
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const userId = userStore.userInfo?.userId
    const res: any = source.value === 'local'
      ? await getProcessedSongById(songId.value, userId)
      : await getProcessedNeteaseLyricById(songId.value)
    // res可能是lines数组，也可能是包含lines的对象
    lyrics.value = Array.isArray(res) ? res : (res?.lines || res?.data?.lines || [])
    if (source.value === 'local') {
      playSong(songId.value).catch(() => {})
    }
    if (userId && userId !== -1) {
      recordLearning(songId.value).catch(() => {})
    }
    saveLearnedSong()
  }
  catch (e: any) {
    error.value = e?.message || '歌词加载失败'
  }
  finally {
    loading.value = false
  }
}

function handleRetry() {
  loadLyrics()
}

function saveLearnedSong() {
  if (!songId.value) return
  try {
    const cached = uni.getStorageSync('learnedSongs') || []
    const list = Array.isArray(cached) ? cached : []
    const filtered = list.filter((item: any) => String(item.song_id) !== String(songId.value))
    filtered.unshift({
      song_id: songId.value,
      song_name: songName.value,
      singer: singer.value,
      cover_url: coverUrl.value,
      source: source.value,
    })
    uni.setStorageSync('learnedSongs', filtered.slice(0, 20))
  }
  catch {}
}

function handleTokenClick(token: Token, lineIndex: number) {
  selectedToken.value = token
  selectedLineIndex.value = lineIndex
  showWordDetail.value = true
}

function closeWordDetail() {
  showWordDetail.value = false
  selectedToken.value = null
}

async function addToWordbook() {
  if (!selectedToken.value || !userStore.userInfo?.userId) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
    })
    return
  }
  
  if (addingWord.value) return
  
  addingWord.value = true
  try {
    const line = lyrics.value[selectedLineIndex.value]
    await addWordToBook({
      song_id: songId.value,
      line_num: selectedLineIndex.value,
      token_id: selectedToken.value.token_id,
      word: selectedToken.value.text,
      kana: selectedToken.value.kana,
      pos: selectedToken.value.pos,
      meaning: '', // 可以从tags或其他地方获取
      example_sentence: line?.original || '',
    })
    uni.showToast({
      title: '已添加到单词本',
      icon: 'success',
    })
    closeWordDetail()
  } catch (e: any) {
    uni.showToast({
      title: e?.message || '添加失败',
      icon: 'none',
    })
  } finally {
    addingWord.value = false
  }
}

// 渲染假名标注的HTML
function renderFuriganaHtml(line: LyricLine) {
  if (!line.tokens || line.tokens.length === 0) {
    return line.furigana_html || line.original
  }
  
  // 使用tokens构建可点击的HTML
  return line.tokens.map((token, idx) => {
    const furiganaHtml = token.furigana_html || token.text
    return `<span class="lyric-token" data-token-idx="${idx}" style="cursor: pointer; padding: 2px 1px; border-radius: 2px; transition: background 0.2s;" onmouseover="this.style.background='rgba(59, 130, 246, 0.1)'" onmouseout="this.style.background=''">${furiganaHtml}</span>`
  }).join('')
}

function handleGrammarClick(grammar: any, line: LyricLine) {
  selectedGrammar.value = grammar
  selectedGrammarLine.value = line
  showGrammarPopup.value = true
}

async function handleAddGrammar() {
  if (!selectedGrammar.value || !userStore.userInfo?.userId) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  if (addingGrammar.value) return
  addingGrammar.value = true
  try {
    const g = selectedGrammar.value
    await addGrammarToBook({
      song_id: songId.value,
      line_num: lyrics.value.indexOf(selectedGrammarLine.value!),
      grammar_id: g.grammar_id || g.rule_id || 0,
      related_token_ids: g.token_ids || [],
      grammar_type: g.level || '',
      grammar_relation: g.pattern || '',
      structure_desc: g.name || '',
      grammar_desc: g.description || '',
      example_sentence: selectedGrammarLine.value?.original || '',
    })
    uni.showToast({ title: '已添加到语法本', icon: 'success' })
    showGrammarPopup.value = false
  } catch (e: any) {
    uni.showToast({ title: e?.message || '添加失败', icon: 'none' })
  } finally {
    addingGrammar.value = false
  }
}

function chooseAndReUploadAudio() {
  // #ifdef H5
  uni.chooseFile({
    count: 1,
    type: 'file',
    success(res) {
      const file = res.tempFiles?.[0]
      if (file?.path) doReUpload(file.path)
    },
  })
  // #endif
  // #ifdef MP-WEIXIN
  uni.chooseMedia({
    count: 1,
    mediaType: ['audio'],
    success(res) {
      const file = res.tempFiles?.[0]
      if (file?.tempFilePath) doReUpload(file.tempFilePath)
    },
  })
  // #endif
}

function doReUpload(filePath: string) {
  if (!userStore.userInfo?.userId) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  reUploading.value = true
  // 创建者或系统歌曲（create_user=-1）直接更新，其他人走建议审核
  const canDirectUpdate = isCreator.value || songCreator.value === '-1' || !songCreator.value
  const url = `/songs/upload`
  uni.uploadFile({
    url,
    filePath,
    name: 'file',
    formData: {
      songId: songId.value,
      filename: filePath.split('/').pop() || 'audio.mp3',
      ...(!canDirectUpdate ? { asSuggestion: 'true' } : {}),
    },
    success(res) {
      try {
        const data = JSON.parse(res.data)
        // Handle auth error from uploadFile (not covered by http.ts)
        if (res.statusCode === 401 || data?.statusCode === 401) {
          uni.showToast({ title: '请先登录', icon: 'none' })
          return
        }
        if (res.statusCode >= 400 || data?.error) {
          uni.showToast({ title: data?.error || data?.message || '上传失败', icon: 'none' })
          return
        }
        if (canDirectUpdate) {
          // 直接生效
          audioUrl.value = data?.data?.url || ''
          hasAudio.value = true
          destroyAudio()
          initAudio()
          uni.showToast({ title: '音频已更新', icon: 'success' })
        }
        else if (data?.data?.path && data?.data?.url) {
          // 走建议审核流程
          submitSuggestion(songId.value, {
            line_index: 0,
            time_ms: 0,
            edits: [{ field: 'audio', old_value: '', new_value: data.data.path }],
            reason: '重新上传音频',
          }).then(() => {
            try {
              const overrides = JSON.parse(uni.getStorageSync('audioOverrides') || '{}')
              overrides[songId.value] = data.data.url
              uni.setStorageSync('audioOverrides', JSON.stringify(overrides))
            } catch {}
            audioUrl.value = data.data.url
            hasAudio.value = true
            destroyAudio()
            initAudio()
            uni.showToast({ title: '音频已上传，等待审核', icon: 'success' })
          }).catch((e: any) => {
            uni.showToast({ title: e?.message || '提交建议失败', icon: 'none' })
          })
        }
      } catch {
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
    },
    fail() {
      uni.showToast({ title: '上传失败', icon: 'none' })
    },
    complete() {
      reUploading.value = false
    },
  })
}

function nextPreStudyWord() {
  showPreStudyMeaning.value = false
  const words = preStudyActiveLevelWords.value
  if (currentPreStudyIndex.value < words.length - 1) {
    currentPreStudyIndex.value++
  } else {
    showPreStudy.value = false
  }
}

function skipPreStudy() {
  showPreStudy.value = false
}

function preStudyLevelLabel(tag: string) {
  return tag.replace('JLPT_', 'N')
}

const preStudyLevelKeys = computed(() => {
  return Object.keys(preStudyGrouped.value).sort()
})

const preStudyActiveLevelWords = computed(() => {
  return preStudyGrouped.value[preStudyActiveLevel.value] || []
})

// Pre-study: track which words have answer revealed (list mode)
const preStudyRevealedWords = ref<Set<string>>(new Set())

function togglePreStudyReveal(key: string) {
  if (preStudyRevealedWords.value.has(key)) {
    preStudyRevealedWords.value.delete(key)
  } else {
    preStudyRevealedWords.value.add(key)
  }
  // Trigger reactivity
  preStudyRevealedWords.value = new Set(preStudyRevealedWords.value)
}

// Generate a unique token_id from word text for pre-study words
function wordHash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

async function addPreStudyWordToBook(word: any) {
  if (!userStore.userInfo?.userId) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  const key = word.base_form || word.word
  if (addingPreStudyWord.value === key) return
  addingPreStudyWord.value = key
  try {
    await addWordToBook({
      song_id: songId.value,
      line_num: -1,
      token_id: wordHash(word.word),
      word: word.word,
      kana: word.kana,
      pos: word.pos,
      meaning: word.meaning || '',
      example_sentence: word.example || '',
    })
    uni.showToast({ title: '已添加', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '添加失败', icon: 'none' })
  } finally {
    addingPreStudyWord.value = null
  }
}

async function addAllPreStudyWords() {
  if (!userStore.userInfo?.userId) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  const words = preStudyActiveLevelWords.value
  if (!words.length) return
  let added = 0
  for (const word of words) {
    try {
      await addWordToBook({
        song_id: songId.value,
        line_num: -1,
        token_id: wordHash(word.word),
        word: word.word,
        kana: word.kana,
        pos: word.pos,
        meaning: word.meaning || '',
        example_sentence: word.example || '',
      })
      added++
    } catch {}
  }
  uni.showToast({ title: `已添加 ${added} 个词`, icon: 'success' })
}

function startCardMode() {
  preStudyMode.value = 'card'
  currentPreStudyIndex.value = 0
  showPreStudyMeaning.value = false
}

function openEditPopup(line: LyricLine, index: number) {
  if (!userStore.userInfo?.userId) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  editLineIndex.value = index
  editTimeMs.value = line.time || 0
  editOriginal.value = editOriginalOld.value = line.original || ''
  editTranslate.value = editTranslateOld.value = line.translate || ''
  editRoma.value = editRomaOld.value = line.roma || ''
  editReason.value = ''
  // Populate kana edit list from tokens
  editKanaList.value = (line.tokens || [])
    .filter((t: Token) => t.has_kanji)
    .map((t: Token) => ({ text: t.text, kana: t.kana, originalKana: t.kana, hasKanji: t.has_kanji }))
  showEditPopup.value = true
}

async function handleSubmitEdit() {
  if (submittingEdit.value) return
  const edits: { field: string; token_text?: string; old_value: string; new_value: string }[] = []
  if (editOriginal.value !== editOriginalOld.value) {
    edits.push({ field: 'original', old_value: editOriginalOld.value, new_value: editOriginal.value })
  }
  if (editTranslate.value !== editTranslateOld.value) {
    edits.push({ field: 'translate', old_value: editTranslateOld.value, new_value: editTranslate.value })
  }
  if (editRoma.value !== editRomaOld.value) {
    edits.push({ field: 'roma', old_value: editRomaOld.value, new_value: editRoma.value })
  }
  // Kana edits
  for (const item of editKanaList.value) {
    if (item.kana !== item.originalKana) {
      edits.push({ field: 'kana', token_text: item.text, old_value: item.originalKana, new_value: item.kana })
    }
  }
  if (!edits.length) {
    uni.showToast({ title: '没有修改', icon: 'none' })
    return
  }
  submittingEdit.value = true
  try {
    await submitSuggestion(songId.value, {
      line_index: editLineIndex.value,
      time_ms: editTimeMs.value,
      edits,
      reason: editReason.value,
    })
    uni.showToast({ title: '建议已提交', icon: 'success' })
    showEditPopup.value = false
  } catch (e: any) {
    uni.showToast({ title: e?.message || '提交失败', icon: 'none' })
  } finally {
    submittingEdit.value = false
  }
}

onLoad(async (options) => {
  songId.value = (options?.songId as string) || ''
  source.value = (options?.source as string) || 'local'
  songName.value = decodeURIComponent((options?.songName as string) || '')
  singer.value = decodeURIComponent((options?.singer as string) || '')
  coverUrl.value = decodeURIComponent((options?.coverUrl as string) || '')
  // Refresh user info to get latest isAdmin status (silent, no error toast)
  if (userStore.userInfo?.userId && userStore.userInfo.userId !== -1) {
    http.get('/user/info', undefined, undefined, { hideErrorToast: true }).then((res: any) => {
      if (res) userStore.setUserInfo(res)
    }).catch(() => {})
  }
  await loadLyrics()
  // Fetch song creator info
  if (source.value === 'local') {
    try {
      const songInfo: any = await getSongById(songId.value)
      songCreator.value = songInfo?.create_user || ''
    } catch {}
  }
  // Load pre-study vocabulary
  const userLevel = userStore.userInfo?.level || 'N5'
  if (source.value === 'local' && songId.value && userStore.userInfo?.userId) {
    try {
      const vocabRes: any = await getSongVocabulary(songId.value, userLevel, userStore.userInfo.userId)
      preStudyWords.value = vocabRes?.vocabulary || []
      preStudyGrouped.value = vocabRes?.grouped || {}
      preStudyMasteredCount.value = vocabRes?.mastered_count || 0
      if (preStudyWords.value.length > 0) {
        // Set active level to the user's current level tag if available, else first group
        const levelTag = `JLPT_${userLevel.replace('N', '')}`
        const groupKeys = Object.keys(preStudyGrouped.value).sort()
        preStudyActiveLevel.value = groupKeys.includes(levelTag) ? levelTag : (groupKeys[0] || '')
        currentPreStudyIndex.value = 0
        showPreStudyMeaning.value = false
        preStudyMode.value = 'list'
        showPreStudy.value = true
      }
    } catch {}
  }
  await loadAudioUrl()
  if (hasAudio.value) {
    initAudio()
  }
})

onUnload(() => {
  destroyAudio()
  stopQRPoll()
  // #ifdef H5
  document.removeEventListener('keydown', handleKeydown)
  // #endif
})

// #ifdef H5
function handleKeydown(e: KeyboardEvent) {
  // Ignore if user is typing in an input
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return

  if (e.code === 'Space') {
    e.preventDefault()
    togglePlay()
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault()
    if (audioContext) {
      const t = Math.max(0, (audioContext.currentTime || currentTime.value) - 5)
      audioContext.seek(t)
      currentTime.value = t
    }
  } else if (e.code === 'ArrowRight') {
    e.preventDefault()
    if (audioContext) {
      const t = Math.min(duration.value, (audioContext.currentTime || currentTime.value) + 5)
      audioContext.seek(t)
      currentTime.value = t
    }
  }
}
document.addEventListener('keydown', handleKeydown)
// #endif
</script>

<template>
  <view class="p-4">
    <view class="mb-3 flex items-center justify-between">
      <view class="text-lg font-bold">歌词学习</view>
      <view class="flex items-center gap-2 flex-wrap">
        <view class="flex items-center">
          <text class="mr-1 text-xs text-gray-600">假名</text>
          <wd-switch v-model="showFurigana" size="20" />
        </view>
        <view class="flex items-center">
          <text class="mr-1 text-xs text-gray-600">翻译</text>
          <wd-switch v-model="showTranslate" size="20" />
        </view>
        <view class="flex items-center">
          <text class="mr-1 text-xs text-gray-600">罗马音</text>
          <wd-switch v-model="showRoma" size="20" />
        </view>
        <view class="flex items-center">
          <text class="mr-1 text-xs text-gray-600">语法</text>
          <wd-switch v-model="showGrammar" size="20" />
        </view>
      </view>
    </view>

    <!-- Audio Player (sticky) -->
    <view v-if="hasAudio" class="audio-player bg-white rounded-lg p-3 mb-4 shadow-sm sticky top-0 z-10">
      <view class="flex items-center gap-3">
        <view class="play-btn w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0" @click="togglePlay">
          <text class="text-white text-lg">{{ isPlaying ? '⏸' : '▶' }}</text>
        </view>
        <view class="flex-1">
          <slider
            :value="duration ? (currentTime / duration) * 100 : 0"
            :min="0"
            :max="100"
            :step="0.1"
            activeColor="#3b82f6"
            backgroundColor="#e5e7eb"
            block-size="12"
            @change="seekTo"
          />
          <view class="flex justify-between text-xs text-gray-400 mt-1">
            <text>{{ formatTime(currentTime) }}</text>
            <text>{{ formatTime(duration) }}</text>
          </view>
        </view>
        <view v-if="userStore.userInfo?.userId" class="flex-shrink-0 flex gap-1">
          <wd-button type="info" size="small" :loading="reUploading" @click="chooseAndReUploadAudio">
            重传音频
          </wd-button>
          <wd-button v-if="isAdmin" type="warning" size="small" :loading="downloadingAudio" @click="handleDownloadAudio">
            获取完整音频
          </wd-button>
        </view>
      </view>
    </view>
    <!-- Upload audio when no audio exists (any logged-in user) -->
    <view v-else-if="userStore.userInfo?.userId" class="mb-4 flex gap-2">
      <wd-button type="primary" size="small" :loading="reUploading" @click="chooseAndReUploadAudio">
        上传音频
      </wd-button>
      <wd-button v-if="isAdmin" type="warning" size="small" :loading="downloadingAudio" @click="handleDownloadAudio">
        获取完整音频
      </wd-button>
    </view>

    <template v-if="loading">
      <view class="py-6 text-center text-gray-500">加载中...</view>
    </template>
    <template v-else-if="error">
      <view class="py-6 text-center text-red-500">{{ error }}</view>
      <view class="mt-2 text-center text-blue-500" @click="handleRetry">
        点击重试
      </view>
    </template>
    <template v-else-if="lyrics.length === 0">
      <view class="py-6 text-center text-gray-500">暂无歌词</view>
    </template>
    <template v-else>
      <!-- Review link for song creator -->
      <view
        v-if="isCreator"
        class="mb-3 text-center text-blue-500 text-sm"
        @click="uni.navigateTo({ url: `/pages/song/suggestions?songId=${songId}` })"
      >
        查看修改建议
      </view>
      <!-- Pre-study vocabulary button -->
      <view
        v-if="preStudyWords.length > 0"
        class="mb-3 text-center"
      >
        <wd-button type="info" size="small" @click="showPreStudy = true; preStudyMode = 'list'">
          生词预习 ({{ preStudyWords.length }})
        </wd-button>
      </view>
      <view class="lyrics-scroll-container">
        <view
          v-for="(line, index) in lyrics"
          :key="index"
          :id="`lyric-line-${index}`"
          class="mb-4 p-3 rounded-lg transition-all duration-300"
          :class="currentLineIndex === index
            ? 'bg-blue-50 border-l-4 border-blue-500 scale-[1.01]'
            : 'bg-gray-50'"
        >
          <!-- Line number -->
          <view class="text-xs text-gray-300 mb-1">{{ index + 1 }}</view>
          <!-- 假名标注的歌词行 -->
          <view v-if="showFurigana && line.tokens && line.tokens.length > 0" class="mb-2">
            <view class="flex flex-wrap items-center gap-1 text-base leading-relaxed">
              <view
                v-for="(token, tokenIdx) in line.tokens"
                :key="tokenIdx"
                class="lyric-token inline-block px-1 py-0.5 rounded transition-colors"
                :class="token.has_kanji ? 'hover:bg-blue-100 cursor-pointer active:bg-blue-200' : ''"
                @click="token.has_kanji ? handleTokenClick(token, index) : null"
              >
                <rich-text
                  :nodes="token.furigana_html || token.text"
                  class="text-base"
                />
              </view>
            </view>
          </view>
          <view v-else class="mb-2 text-base">
            <text>{{ line.original || '' }}</text>
          </view>

          <!-- 翻译 -->
          <view v-if="showTranslate && line.translate" class="text-sm text-gray-600 mt-1">
            {{ line.translate }}
          </view>

          <!-- 罗马音 -->
          <view v-if="showRoma && line.roma" class="text-sm text-gray-400 mt-1 italic">
            {{ line.roma }}
          </view>

          <!-- 语法标注 -->
          <view v-if="showGrammar && line.grammar && line.grammar.length" class="mt-2 flex flex-wrap gap-2">
            <view
              v-for="(g, gi) in line.grammar"
              :key="gi"
              class="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700 active:bg-blue-200"
              @click.stop="handleGrammarClick(g, line)"
            >
              {{ g.name }} · {{ g.level }}
            </view>
          </view>

          <!-- Action buttons -->
          <view class="mt-2 flex gap-2">
            <view
              v-if="hasAudio && line.time != null"
              class="px-2 py-1 rounded bg-gray-100 text-xs text-gray-500 active:bg-gray-200"
              @click.stop="playFromLine(index)"
            >▶ 播放</view>
            <view
              class="px-2 py-1 rounded bg-gray-100 text-xs text-gray-500 active:bg-gray-200"
              @click.stop="openEditPopup(line, index)"
            >✏ 编辑</view>
          </view>
        </view>
      </view>
    </template>

    <!-- 单词详情弹窗 -->
    <wd-popup v-model="showWordDetail" position="bottom" :close-on-click-overlay="true">
      <view v-if="selectedToken" class="p-4 bg-white rounded-t-lg">
        <view class="mb-4 flex items-center justify-between">
          <view class="flex items-center gap-2">
            <view class="text-lg font-bold">{{ selectedToken.text }}</view>
            <view
              class="text-base"
              :class="playingWord === selectedToken.text ? 'text-blue-500' : loadingWord === selectedToken.text ? 'text-orange-400 animate-pulse' : 'text-gray-400'"
              @click="playWord(selectedToken.text, selectedToken.kana)"
            >{{ loadingWord === selectedToken.text ? '⏳' : '🔊' }}</view>
          </view>
          <wd-icon name="close" @click="closeWordDetail" />
        </view>
        
        <view class="mb-3">
          <view class="text-sm text-gray-500 mb-1">假名</view>
          <view class="text-base">{{ selectedToken.kana }}</view>
        </view>
        
        <view class="mb-3" v-if="selectedToken.base_form !== selectedToken.text">
          <view class="text-sm text-gray-500 mb-1">基本形</view>
          <view class="text-base">{{ selectedToken.base_form }}</view>
        </view>
        
        <view class="mb-3">
          <view class="text-sm text-gray-500 mb-1">词性</view>
          <view class="text-base">{{ selectedToken.pos }} {{ selectedToken.pos_detail }}</view>
        </view>

        <view class="mb-3" v-if="selectedToken.meaning">
          <view class="text-sm text-gray-500 mb-1">释义</view>
          <view class="text-base">{{ selectedToken.meaning }}</view>
        </view>

        <view class="mb-3" v-if="selectedToken.tags && selectedToken.tags.length > 0">
          <view class="text-sm text-gray-500 mb-1">标签</view>
          <view class="flex flex-wrap gap-2">
            <view
              v-for="tag in selectedToken.tags"
              :key="tag"
              class="rounded bg-green-100 px-2 py-1 text-xs text-green-700"
            >
              {{ tag }}
            </view>
          </view>
        </view>
        
        <view class="flex gap-2 mt-4">
          <wd-button
            type="primary"
            block
            :loading="addingWord"
            @click="addToWordbook"
          >
            添加到单词本
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- Edit suggestion popup -->
    <wd-popup v-model="showEditPopup" position="bottom" :close-on-click-overlay="true">
      <view class="p-4 bg-white rounded-t-lg">
        <view class="mb-3 flex items-center justify-between">
          <text class="text-lg font-bold">建议修改 (第{{ editLineIndex + 1 }}行)</text>
          <wd-icon name="close" @click="showEditPopup = false" />
        </view>
        <view class="mb-3">
          <text class="text-sm text-gray-500 mb-1">日文原文</text>
          <wd-input v-model="editOriginal" placeholder="日文歌词" clearable />
        </view>
        <view class="mb-3">
          <text class="text-sm text-gray-500 mb-1">中文翻译</text>
          <wd-input v-model="editTranslate" placeholder="翻译" clearable />
        </view>
        <view class="mb-3">
          <text class="text-sm text-gray-500 mb-1">罗马音</text>
          <wd-input v-model="editRoma" placeholder="罗马音" clearable />
        </view>
        <!-- Kana overrides for kanji tokens -->
        <view v-if="editKanaList.length > 0" class="mb-3">
          <text class="text-sm text-gray-500 mb-1">读音修正</text>
          <view v-for="(item, ki) in editKanaList" :key="ki" class="flex items-center gap-2 mt-1">
            <text class="text-sm w-16 flex-shrink-0">{{ item.text }}</text>
            <wd-input v-model="editKanaList[ki].kana" :placeholder="item.originalKana" clearable />
          </view>
        </view>
        <view class="mb-3">
          <text class="text-sm text-gray-500 mb-1">修改原因 (可选)</text>
          <wd-input v-model="editReason" placeholder="说明修改原因" clearable />
        </view>
        <wd-button type="primary" block :loading="submittingEdit" @click="handleSubmitEdit">
          提交建议
        </wd-button>
      </view>
    </wd-popup>

    <!-- Grammar detail popup -->
    <wd-popup v-model="showGrammarPopup" position="bottom" :close-on-click-overlay="true">
      <view v-if="selectedGrammar" class="p-4 bg-white rounded-t-lg">
        <view class="mb-3 flex items-center justify-between">
          <text class="text-lg font-bold">{{ selectedGrammar.name }}</text>
          <wd-icon name="close" @click="showGrammarPopup = false" />
        </view>
        <view class="mb-2">
          <wd-tag type="info" size="small">{{ selectedGrammar.level }}</wd-tag>
        </view>
        <view v-if="selectedGrammar.pattern" class="mb-2 text-sm text-gray-600">
          接续: {{ selectedGrammar.pattern }}
        </view>
        <view v-if="selectedGrammar.description" class="mb-2 text-sm text-gray-700">
          {{ selectedGrammar.description }}
        </view>
        <view v-if="selectedGrammar.matched_text" class="mb-2 text-sm text-gray-500">
          匹配: {{ selectedGrammar.matched_text }}
        </view>
        <view v-if="selectedGrammarLine?.original" class="mb-3 text-sm text-gray-500 bg-gray-50 p-2 rounded">
          例句: {{ selectedGrammarLine.original }}
        </view>
        <wd-button type="primary" block :loading="addingGrammar" @click="handleAddGrammar">
          添加到语法本
        </wd-button>
      </view>
    </wd-popup>

    <!-- Pre-study vocabulary popup -->
    <wd-popup v-model="showPreStudy" position="bottom" :close-on-click-overlay="false">
      <view class="p-4 bg-white rounded-t-lg" style="min-height: 65vh; max-height: 80vh;">
        <view class="flex items-center justify-between mb-3">
          <view class="text-lg font-bold">歌曲生词预习</view>
          <view class="text-sm text-gray-400" @click="skipPreStudy">跳过</view>
        </view>
        <view class="text-xs text-gray-400 mb-3">
          共 {{ preStudyWords.length }} 个生词
          <text v-if="preStudyMasteredCount > 0" class="ml-2">(已掌握 {{ preStudyMasteredCount }} 个)</text>
        </view>

        <!-- Mode toggle -->
        <view class="flex gap-2 mb-3">
          <view
            class="px-3 py-1 rounded-full text-sm"
            :class="preStudyMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'"
            @click="preStudyMode = 'list'"
          >列表</view>
          <view
            class="px-3 py-1 rounded-full text-sm"
            :class="preStudyMode === 'card' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'"
            @click="startCardMode"
          >记忆卡片</view>
        </view>

        <!-- LIST MODE -->
        <template v-if="preStudyMode === 'list'">
          <!-- Level tabs -->
          <view class="flex gap-2 mb-3">
            <view
              v-for="lvl in preStudyLevelKeys"
              :key="lvl"
              class="px-3 py-1 rounded-full text-xs"
              :class="preStudyActiveLevel === lvl
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600'"
              @click="preStudyActiveLevel = lvl"
            >
              {{ preStudyLevelLabel(lvl) }}
              <text class="ml-1">({{ (preStudyGrouped[lvl] || []).length }})</text>
            </view>
          </view>

          <!-- Word list -->
          <scroll-view scroll-y style="max-height: 45vh;">
            <view
              v-for="(word, wi) in preStudyActiveLevelWords"
              :key="wi"
              class="flex items-center justify-between py-2 px-2 border-b border-gray-100"
              @click="togglePreStudyReveal(word.base_form || word.word)"
            >
              <view class="flex-1 min-w-0">
                <view class="flex items-center gap-2">
                  <text class="text-base font-medium">{{ word.word }}</text>
                  <wd-tag v-if="word.pos" type="info" size="small">{{ word.pos }}</wd-tag>
                  <view
                    class="flex-shrink-0 text-sm px-1"
                    :class="playingWord === word.word ? 'text-blue-500' : loadingWord === word.word ? 'text-orange-400 animate-pulse' : 'text-gray-400'"
                    @click.stop="playWord(word.word, word.kana)"
                  >{{ loadingWord === word.word ? '⏳' : '🔊' }}</view>
                </view>
                <template v-if="preStudyRevealedWords.has(word.base_form || word.word)">
                  <view class="text-sm text-gray-500 mt-1">{{ word.kana }}</view>
                  <view class="text-xs text-gray-500 mt-0.5 truncate">{{ word.meaning || '暂无释义' }}</view>
                </template>
                <view v-else class="text-xs text-gray-300 mt-1">点击查看答案</view>
              </view>
              <view
                class="flex-shrink-0 ml-2 px-2 py-1 rounded text-xs bg-blue-50 text-blue-600 active:bg-blue-100"
                @click.stop="addPreStudyWordToBook(word)"
              >
                <text v-if="addingPreStudyWord === (word.base_form || word.word)">...</text>
                <text v-else>+ 生词本</text>
              </view>
            </view>
          </scroll-view>

          <!-- Batch add button -->
          <view class="mt-3 flex gap-2">
            <wd-button type="info" size="small" @click="addAllPreStudyWords">
              一键添加本级全部
            </wd-button>
            <wd-button type="primary" size="small" @click="startCardMode">
              开始记忆
            </wd-button>
          </view>
        </template>

        <!-- CARD MODE -->
        <template v-if="preStudyMode === 'card'">
          <!-- Level tabs -->
          <view class="flex gap-2 mb-3">
            <view
              v-for="lvl in preStudyLevelKeys"
              :key="lvl"
              class="px-3 py-1 rounded-full text-xs"
              :class="preStudyActiveLevel === lvl
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600'"
              @click="preStudyActiveLevel = lvl; currentPreStudyIndex = 0; showPreStudyMeaning = false"
            >
              {{ preStudyLevelLabel(lvl) }}
              <text class="ml-1">({{ (preStudyGrouped[lvl] || []).length }})</text>
            </view>
          </view>
          <view class="text-xs text-gray-400 mb-2">
            {{ currentPreStudyIndex + 1 }} / {{ preStudyActiveLevelWords.length }}
          </view>
          <view v-if="preStudyActiveLevelWords.length > 0" class="flex flex-col items-center py-6">
            <view class="flex items-center gap-2 mb-3">
              <view class="text-3xl font-bold">
                {{ preStudyActiveLevelWords[currentPreStudyIndex].word }}
              </view>
              <view
                class="text-xl"
                :class="playingWord === preStudyActiveLevelWords[currentPreStudyIndex].word ? 'text-blue-500' : loadingWord === preStudyActiveLevelWords[currentPreStudyIndex].word ? 'text-orange-400 animate-pulse' : 'text-gray-400'"
                @click="playWord(preStudyActiveLevelWords[currentPreStudyIndex].word, preStudyActiveLevelWords[currentPreStudyIndex].kana)"
              >{{ loadingWord === preStudyActiveLevelWords[currentPreStudyIndex].word ? '⏳' : '🔊' }}</view>
            </view>
            <view class="mb-2 flex gap-1">
              <wd-tag type="success" size="small">
                {{ preStudyLevelLabel(preStudyActiveLevelWords[currentPreStudyIndex].jlpt_level) }}
              </wd-tag>
              <wd-tag v-if="preStudyActiveLevelWords[currentPreStudyIndex].pos" type="info" size="small">
                {{ preStudyActiveLevelWords[currentPreStudyIndex].pos }}
              </wd-tag>
            </view>
            <view v-if="!showPreStudyMeaning"
              class="mt-4 px-6 py-3 bg-gray-100 rounded-lg text-gray-400 text-sm"
              @click="showPreStudyMeaning = true"
            >
              点击查看答案
            </view>
            <view v-else class="mt-4 text-center">
              <view class="text-lg text-gray-600 mb-1">{{ preStudyActiveLevelWords[currentPreStudyIndex].kana }}</view>
              <view class="text-base text-gray-700">{{ preStudyActiveLevelWords[currentPreStudyIndex].meaning || '暂无释义' }}</view>
            </view>
            <view v-if="showPreStudyMeaning && preStudyActiveLevelWords[currentPreStudyIndex].example" class="mt-3 text-xs text-gray-400 italic text-center">
              「{{ preStudyActiveLevelWords[currentPreStudyIndex].example }}」
            </view>
          </view>
          <view class="flex gap-2 mt-2">
            <wd-button type="info" size="small" @click="addPreStudyWordToBook(preStudyActiveLevelWords[currentPreStudyIndex])">
              + 生词本
            </wd-button>
            <wd-button type="primary" block @click="nextPreStudyWord">
              {{ currentPreStudyIndex < preStudyActiveLevelWords.length - 1 ? '下一个' : '开始学习' }}
            </wd-button>
          </view>
        </template>
      </view>
    </wd-popup>

    <!-- Netease QR Login Popup (admin only) -->
    <wd-popup v-model="showQRLogin" position="center" :close-on-click-modal="true" @close="stopQRPoll">
      <view class="p-6 flex flex-col items-center" style="width: 300px;">
        <text class="text-lg font-bold mb-3">网易云音乐登录</text>
        <image v-if="qrImg" :src="qrImg" mode="aspectFit" style="width: 200px; height: 200px;" class="mb-3" />
        <text class="text-sm text-gray-500 mb-3">{{ qrStatus }}</text>
        <wd-button v-if="qrStatus === '二维码已过期'" type="primary" size="small" @click="startQRLogin">
          刷新二维码
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<style scoped>
/* Desktop: keyboard shortcut hint */
@media (min-width: 768px) {
  .audio-player {
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
}
</style>
