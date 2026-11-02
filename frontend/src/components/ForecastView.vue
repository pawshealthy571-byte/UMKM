<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '../api'

const emit = defineEmits(['notice'])
const days = ref(7)
const data = ref(null)
const busy = ref(false)
const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const projectedChange = computed(() => (data.value?.projectedBalance || 0) - (data.value?.currentBalance || 0))
const chart = computed(() => {
  const actual = data.value?.actual || []
  const projection = data.value?.projection || []
  const values = [...actual.map((item) => Number(item.balance)), ...projection.map((item) => Number(item.balance))]
  if (!values.length) return { actual: '', projection: '', labels: [], min: 0, max: 1 }
  const min = Math.min(...values), max = Math.max(...values), span = Math.max(1, max - min)
  const x = (index) => 42 + index * 710 / Math.max(1, actual.length + projection.length - 1)
  const y = (value) => 230 - (Number(value) - min) * 190 / span
  const actualPoints = actual.map((item, index) => `${x(index)},${y(item.balance)}`)
  const projectedPoints = actual.length ? [`${x(actual.length - 1)},${y(data.value.currentBalance)}`, ...projection.map((item, index) => `${x(actual.length + index)},${y(item.balance)}`)] : []
  const indexes = [...new Set([0, Math.floor((actual.length + projection.length) / 2), actual.length + projection.length - 1])]
  const labels = indexes.map((index) => ({ x: x(index), text: [...actual, ...projection][index]?.date?.slice(5) || '' }))
  return { actual: actualPoints.join(' '), projection: projectedPoints.join(' '), labels, min, max }
})

async function load() {
  busy.value = true
  try { data.value = await api(`/forecast?days=${days.value}`) }
  catch (error) { emit('notice', error.message) }
  finally { busy.value = false }
}
watch(days, load)
onMounted(load)
</script>

<template>
  <div class="content forecast-page">
    <div class="page-intro"><div><div class="eyebrow">PERENCANAAN KAS</div><h2>Prediksi arus kas</h2><p>Perkiraan saldo berdasarkan pola transaksi 30 hari terakhir.</p></div><label class="horizon-select">Periode prediksi<select v-model.number="days"><option :value="7">7 hari ke depan</option><option :value="14">14 hari ke depan</option><option :value="30">30 hari ke depan</option></select></label></div>
    <div v-if="busy && !data" class="panel loading-state">Memuat data prediksi…</div>
    <template v-else-if="data">
      <div v-if="data.sufficientHistory" class="forecast-metrics">
        <article class="metric-card"><div class="metric-top"><span>Saldo saat ini</span></div><strong>{{ money(data.currentBalance) }}</strong><small>Saldo awal dan seluruh transaksi</small></article>
        <article class="metric-card forecast-result"><div class="metric-top"><span>Proyeksi saldo · {{ days }} hari</span></div><strong :class="data.projectedBalance >= 0 ? 'text-green' : 'text-red'">{{ money(data.projectedBalance) }}</strong><small :class="projectedChange >= 0 ? 'text-green' : 'text-red'">{{ projectedChange >= 0 ? '▲' : '▼' }} {{ money(Math.abs(projectedChange)) }} dari saldo saat ini</small></article>
        <article class="metric-card"><div class="metric-top"><span>Perkiraan pemasukan</span></div><strong class="text-green">{{ money(data.expectedIncome) }}</strong><small>Rata-rata harian × {{ days }} hari</small></article>
        <article class="metric-card"><div class="metric-top"><span>Perkiraan pengeluaran</span></div><strong>{{ money(data.expectedExpense) }}</strong><small>Rata-rata harian × {{ days }} hari</small></article>
      </div>
      <div v-if="data.sufficientHistory && data.projectedBalance < data.minimumBalance" class="forecast-alert"><span class="forecast-alert-icon">!</span><div><strong>Proyeksi di bawah batas minimum kas</strong><p>Saldo terproyeksi {{ money(data.projectedBalance) }} dibanding batas {{ money(data.minimumBalance) }}.</p></div></div>
      <div v-else-if="data.sufficientHistory" class="forecast-safe"><span>✓</span><div><strong>Proyeksi berada di atas batas minimum kas</strong><p>Batas minimum saat ini {{ money(data.minimumBalance) }}.</p></div></div>
      <article v-if="!data.sufficientHistory" class="panel forecast-empty"><div class="empty-icon">⌁</div><h3>Data historis belum cukup</h3><p>Saldo saat ini {{ money(data.currentBalance) }}. Baru ada transaksi pada {{ data.historyDays }} hari berbeda dalam 30 hari terakhir. Catat transaksi pada setidaknya 7 hari berbeda agar estimasi ditampilkan.</p><small>Tanpa data yang cukup, aplikasi tidak menampilkan angka proyeksi atau status risiko. Setelah syarat terpenuhi, proyeksi memakai rata-rata sederhana dan tetap bukan nilai pasti.</small></article>
      <article v-else class="panel forecast-chart-panel"><div class="panel-heading"><div><h3>Saldo aktual dan proyeksi</h3><p>Garis putus-putus menunjukkan estimasi, bukan kepastian.</p></div><span class="data-window">Jendela data · 30 hari</span></div><div class="forecast-chart"><svg viewBox="0 0 800 280" role="img" aria-label="Grafik saldo aktual dan proyeksi"><line v-for="y in [40, 100, 160, 230]" :key="y" x1="42" :y1="y" x2="752" :y2="y" stroke="#E2E8F0" stroke-width="1"/><polyline :points="chart.actual" fill="none" stroke="#173B67" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><polyline :points="chart.projection" fill="none" stroke="#15803D" stroke-width="3" stroke-dasharray="8 6" stroke-linejoin="round" stroke-linecap="round"/><text v-for="label in chart.labels" :key="label.x" :x="label.x" y="263" text-anchor="middle">{{ label.text }}</text></svg><div class="forecast-legend"><span><i></i> Saldo aktual</span><span><i></i> Proyeksi</span></div></div></article>
      <article class="panel assumptions-panel"><div class="section-heading"><span class="section-icon">i</span><div><h3>Metode dan asumsi</h3><p>Perhitungan yang transparan agar mudah ditinjau.</p></div></div><ul><li>Sistem menghitung rata-rata pemasukan dan pengeluaran per hari kalender selama 30 hari terakhir, termasuk hari tanpa transaksi sebagai Rp0.</li><li>Rata-rata dikalikan dengan periode yang dipilih, lalu ditambahkan ke saldo saat ini.</li><li>Perubahan musiman, transaksi yang belum dicatat, dan kejadian tak terduga belum diperhitungkan.</li></ul></article>
    </template>
  </div>
</template>

<style>
.horizon-select{display:grid;gap:7px;color:#64748B;font-size:11px;font-weight:600;min-width:185px}.horizon-select select{border:1px solid #E2E8F0;background:#fff;border-radius:7px;padding:10px 12px;color:#172B4D;font-size:13px}.forecast-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-bottom:17px}.forecast-result{border-color:#d5e4dc}.forecast-alert,.forecast-safe{display:flex;align-items:center;gap:12px;border-radius:8px;padding:13px 16px;margin:0 0 16px}.forecast-alert{background:#FEF3C7;color:#B45309;border:1px solid #FDE68A}.forecast-safe{background:#DCFCE7;color:#15803D;border:1px solid #BBF7D0}.forecast-alert strong,.forecast-safe strong{font-size:12px}.forecast-alert p,.forecast-safe p{font-size:11px;margin:3px 0 0;color:#526176}.forecast-alert-icon{font-weight:800;font-size:18px}.forecast-chart-panel{margin-bottom:16px}.forecast-chart{height:350px;position:relative}.forecast-chart svg{width:100%;height:calc(100% - 26px);overflow:visible}.forecast-chart svg text{fill:#64748B;font-size:11px}.forecast-legend{display:flex;justify-content:center;gap:20px;color:#64748B;font-size:11px}.forecast-legend span{display:flex;align-items:center;gap:6px}.forecast-legend i{width:16px;border-top:3px solid #173B67}.forecast-legend span+span i{border-color:#15803D;border-top-style:dashed}.data-window{font-size:11px;color:#64748B;background:#F5F7FA;padding:7px 10px;border-radius:6px}.forecast-empty{text-align:center;padding:44px 22px;margin-bottom:16px}.forecast-empty .empty-icon{margin:0 auto 13px}.forecast-empty h3{font-size:17px;margin:0 0 8px;color:#172B4D}.forecast-empty p{max-width:510px;margin:0 auto 10px;color:#64748B;font-size:13px;line-height:1.6}.forecast-empty small{font-size:11px;color:#8390a1}.assumptions-panel{padding:22px 25px}.section-heading{display:flex;align-items:flex-start;gap:11px}.section-heading h3{font-size:15px;margin:0 0 4px}.section-heading p{font-size:12px;color:#64748B;margin:0}.section-icon{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#eff4fa;color:#173B67;font-weight:700}.assumptions-panel ul{margin:17px 0 0 37px;padding:0;display:grid;gap:9px;color:#526176;font-size:12px;line-height:1.55}.loading-state{text-align:center;color:#64748B;padding:45px}@media(max-width:1100px){.forecast-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.forecast-page .page-intro{display:grid}.horizon-select{width:100%}.forecast-metrics{grid-template-columns:1fr 1fr;gap:9px}.forecast-metrics .metric-card{padding:13px}.forecast-metrics .metric-card>strong{font-size:15px}.forecast-chart{height:260px}.data-window{display:none}.assumptions-panel{padding:18px 15px}.assumptions-panel ul{margin-left:20px}}
</style>
