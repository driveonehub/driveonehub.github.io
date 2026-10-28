/* =======================
   COLUMN MAP
======================= */
const COL_DV = { X:23,E:4,G:6,M:12,P:15,V:21,S:18,T:19,AA:26,AB:27,AD:29 };
const COL_DR = { V:21,E:4,G:6,M:12,P:15,S:18,T:19,AD:29,X:23,Y:24 };

let origin=[];

/* =======================
   GET COLUMN INDEX DYNAMICALLY FROM HEADER ROW
======================= */
function getColumnIndexes(headers, group) {
  const map = {};

  function idx(name) {
    const i = headers.indexOf(name);
    return i === -1 ? null : i;
  }

  if (group === 'DV') {
    map.Noido     = idx('Nối');
    map.Nlap      = idx('Ngày lập');
    map.TenKH     = idx('Tên người bán/Tên người xuất hàng');
    map.Tongtien  = idx('Tổng tiền thanh toán');
    map.Trangthai = idx('Trạng thái hóa đơn');
    map.Checkinfo = idx('Check TT');
    map.WebTC     = idx('Link web tra cứu');
    map.LinkTC    = idx('Link tra cứu');
    map.Fkey      = idx('Fkey/ ID');
    map.Linkview  = idx('Link xem hóa đơn');
    map.Nhaplieu  = idx('Ngày lập (check)');
  } else {
    map.Noido     = idx('Nối');
    map.Nlap      = idx('Ngày lập');
    map.TenKH     = idx('Tên người mua/Tên người nhận hàng');
    map.Tongtien  = idx('Tổng tiền thanh toán');
    map.Trangthai = idx('Trạng thái hóa đơn');
    map.Congtrinh = idx('Mã Công trình');
    map.WebTC     = idx('Link web tra cứu');
    map.LinkTC    = idx('Link tra cứu');
    map.Fkey      = idx('Fkey/ ID');
    map.Linkview  = idx('Link xem hóa đơn');
    map.Nhaplieu  = idx('Ngày lập (check)');
  }
  return map;
}
  
/* =======================
   INIT SOURCE SELECT
======================= */
const source=document.getElementById('source');
Object.entries(CSV_MAP).forEach(([k,v])=>{
  source.innerHTML+=`<option value="${k}">${v.label}</option>`;
});

/* =======================
   CSV PARSER
======================= */
function parseCSV(t){
  const r=[];let c='',row=[],q=false;
  for(let i=0;i<t.length;i++){
    const ch=t[i],n=t[i+1];
    if(ch=='"'&&n=='"'){c+='"';i++}
    else if(ch=='"')q=!q
    else if(ch==','&&!q){row.push(c);c=''}
    else if((ch=='\n'||ch=='\r')&&!q){
      if(c||row.length){row.push(c);r.push(row)}
      row=[];c=''
    }else c+=ch
  }
  if(c||row.length){row.push(c);r.push(row)}
  return r
}

/* =======================
   YEAR + NUMBER FIX
======================= */
function getYear(v){
  const m=v?.match(/(19|20)\d{2}/);
  return m?m[0]:null;
}

/* 🔧 SỬA DUY NHẤT CHO DR */
function parseNumber(val){
  if(val === null || val === undefined || val === '') return 0;
  // Nếu đã là Number thì trả về ngay
  if(typeof val === 'number'){
    return Number.isFinite(val) ? val : 0;
  }
  let s = String(val).trim();
  if(!s) return 0;
  // 1. Xử lý số âm dạng ngoặc (1.234,56) => -1234.56
  let negative = false;
  if(/^\(.*\)$/.test(s)){
    negative = true;
    s = s.slice(1, -1).trim();
  }
  // 2. Xử lý dấu âm
  if(s.startsWith('-')){
    negative = true;
    s = s.slice(1).trim();
  }
  // 3. Bỏ ký hiệu tiền tệ / khoảng trắng / ký tự lạ, Giữ lại số, "." và ","
  s = s
    .replace(/\s/g, '')
    .replace(/[₫đĐ]/g, '')
    .replace(/VND/gi, '')
    .replace(/[^\d.,]/g, '');
  if(!s) return 0;
  // 4. Không có dấu phân cách
  if(!s.includes('.') && !s.includes(',')){
    const n = Number(s);
    return Number.isFinite(n)
      ? (negative ? -n : n)
      : 0;
  }
  // 5. Có cả "." và "," thì dấu xuất hiện cuối cùng = dấu thập phân: 1.234.567,89 => 1234567.89 / 1,234,567.89 => 1234567.89
  if(s.includes('.') && s.includes(',')){
    const lastDot   = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    let decimalSeparator;
    let thousandSeparator;
    if(lastComma > lastDot){
      decimalSeparator = ',';
      thousandSeparator = '.';
    }else{
      decimalSeparator = '.';
      thousandSeparator = ',';
    }
    // Bỏ toàn bộ dấu hàng nghìn
    s = s.split(thousandSeparator).join('');
    // Đổi dấu thập phân thành "."
    s = s.replace(decimalSeparator, '.');
  }else{
    // 6. Chỉ có một loại dấu
    const separator = s.includes('.') ? '.' : ',';
    const parts = s.split(separator);
    // Có nhiều dấu: 1.234.567 / 1,234,567 => chắc chắn là phân cách hàng nghìn
    if(parts.length > 2){
      s = parts.join('');
    }else{
      const integerPart = parts[0];
      const decimalPart = parts[1] || '';
      // Chỉ có 1 dấu.
      // Nếu phần sau có đúng 3 chữ số và phần trước không phải 0: 1.234  => 1234 / 12.345 => 12345
      // Nếu 1-2 chữ số: 1.23 => 1.23 / 12.50 => 12.50
      // Nếu >3 chữ số: 1.2345 => 1.2345
      if(decimalPart.length === 3 && integerPart.length >= 1){
        s = integerPart + decimalPart;
      }else{
        s = integerPart + '.' + decimalPart;
      }
    }
  }
  const n = Number(s);
  if(!Number.isFinite(n)) return 0;
  return negative ? -n : n;
}

/* =======================
   HEADER
======================= */
const TABLE_HEADER={
  DV:['MST-KH-Số hóa đơn','Ngày','Tên khách hàng','Tổng tiền','Trạng thái','Check','Web tra cứu','ID/Fkey','Xem','✔'],
  DR:['MST-KH-Số hóa đơn','Ngày','Tên khách hàng','Tổng tiền','Trạng thái','Web','ID/Fkey','Công trình','Xem','✔']
};

function renderHeader(group){
  thead.innerHTML='';
  const tr=document.createElement('tr');
  TABLE_HEADER[group].forEach(t=>{
    const th=document.createElement('th');
    // Gắn class dựa theo tên cột
    if(t === 'Web tra cứu' || t === 'Web') th.className = 'col-web';
    if(t === 'ID/Fkey') th.className = 'col-fkey';
    if(t === '✔'){
    th.innerHTML = `
    <input type="checkbox" id="checkAll" checked disabled
      onchange="SumTongtien(true)">
    `;
    } else {
    th.textContent = t;
    }
    tr.appendChild(th);
  });
  thead.appendChild(tr);
}

/* =======================
   LOAD DATA
======================= */
const year=document.getElementById('year');

/* === INIT YEAR SELECT (AUTO)=== */
(function initYearSelect(){
  const currentYear = new Date().getFullYear();
  const startYear = 2021; // có thể đổi nếu muốn

  year.innerHTML = `<option value="all">Chọn năm</option>`;

  for(let y = startYear; y <= currentYear; y++){
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if(y === currentYear) opt.selected = true;
    year.appendChild(opt);
  }
})();

const title=document.getElementById('title');
const tb=document.getElementById('tb');
const search=document.getElementById('search');
let filterTimer = null;
const thead=document.getElementById('thead');

function load(){
  const key=source.value;
  const y=year.value;
  const cfg=CSV_MAP[key];

  title.textContent = y === 'all' ? `${cfg.label} tất cả các năm`  : `${cfg.label} năm ${y}`;
  renderHeader(cfg.group);
  // ===== RESET TRẠNG THÁI CŨ =====
  document.querySelector('tfoot').style.display = 'none';
  document.getElementById('sumTotal').textContent = '0';
  const master = document.getElementById('checkAll');
  if(master){
    master.checked = true;
    master.indeterminate = false;
    master.disabled = true;
  }
  tb.innerHTML='<tr><td colspan="10">Đang load dữ liệu ...</td></tr>';

  fetch(cfg.url).then(r=>r.text()).then(t=>{
    const rows=parseCSV(t);
    origin=[];
    const headers = rows[3]; // Hàng thứ 4 (index 3)
    const col = getColumnIndexes(headers, cfg.group); // Lấy các chỉ mục cột theo tên cột từ header row
    for(let i=4;i<rows.length;i++){
      const r=rows[i];
      const d = r[col.Nlap]; // Lấy giá trị cột "Ngày"
      if(!d) continue;
      if(y !== 'all' && getYear(d) !== y) continue;

      if(cfg.group==='DV'){
        const obj = {
          Dgroup: 'DV',
          Noido:r[col.Noido],
          Nlap:d,
          TenKH:r[col.TenKH],
          Tongtien:parseNumber(r[col.Tongtien]),
          Trangthai:r[col.Trangthai],
          Checkinfo:r[col.Checkinfo],
          WebTC:r[col.WebTC],
          LinkTC:r[col.LinkTC],
          Fkey:r[col.Fkey],
          Linkview:r[col.Linkview],
          Nhaplieu:r[col.Nhaplieu]
        };
	obj._search = Object.values(obj)
   	 .map(v => v ?? '').join(' ').toLowerCase();
	origin.push(obj);
      }else{
        const obj = {
          Dgroup: 'DR',
          Noido:r[col.Noido],
          Nlap:d,
          TenKH:r[col.TenKH],
          Tongtien:parseNumber(r[col.Tongtien]),   // 🔧 FIX DR
          Trangthai:r[col.Trangthai],
          Congtrinh:r[col.Congtrinh],
          WebTC:r[col.WebTC],
          LinkTC:r[col.LinkTC],
          Fkey:r[col.Fkey],
          Linkview:r[col.Linkview],
          Nhaplieu:r[col.Nhaplieu]
        };
	obj._search = Object.values(obj)
   	 .map(v => v ?? '').join(' ').toLowerCase();
	origin.push(obj);
      }
    }
    render(origin);
  if(search.value){
    filter();
    }
  });
}

/* =======================
   LINK NULL (LINK RỖNG => BỎ QUA)
======================= */
function SafeLink(url, text='xem file'){
  if(!url) return '';
  const u = url.toString().trim();
  if(!u || u.toLowerCase()==='null') return '';
  return `<a href="${u}" target="_blank">${text}</a>`;
}

/* =======================
   RENDER
======================= */
function render(data){
  tb.innerHTML='';
  if(!data.length){
    tb.innerHTML='<tr><td colspan="10">Không có dữ liệu</td></tr>';
    document.querySelector('tfoot').style.display = 'none'; // Ẩn dòng tổng nếu không có dữ liệu
    return;
  }
  data.forEach(r=>{
    const tr=document.createElement('tr');

    const adRaw = (r.Dgroup==='DV' ? r.Nhaplieu : r.Congtrinh) ?? '';
    const adNorm = adRaw.replace(/\s+/g,'').toLowerCase();

    if(r.Dgroup === 'DV'){ // DV: chỉ bôi khi ngày lập (check) = NoData
    if(adNorm === 'nodata'){
    tr.className = 'nodata';
    }
    } else if(r.Dgroup === 'DR'){  // DR: bôi khi Công trình rỗng
    if(adNorm === ''){
    tr.className = 'nodata';
    }
  }


    const FkeyText=(r.Fkey&&r.Fkey.length>20)?r.Fkey.slice(0,18)+'***':r.Fkey;
  if(r.Dgroup === 'DV'){
    tr.innerHTML=`
  <td>${r.Noido||''}</td>
  <td>${r.Nlap||''}</td>
  <td>${r.TenKH||''}</td>
  <td class="number" data-money="${r.Tongtien}">${r.Tongtien.toLocaleString('en-US')}</td>
  <td>${r.Trangthai||''}</td>
  <td>${r.Checkinfo||''}</td>
  <td class="col-web">${r.LinkTC?`<a href="${r.LinkTC}" target="_blank">${r.WebTC}</a>`:(r.WebTC||'')}</td>
  <td class="col-fkey">${FkeyText||''}</td>
  <td>${SafeLink(r.Linkview, 'xem')}</td>
  <td><input type="checkbox" class="row-check" checked onchange="SumTongtien()"></td>
  `;
    }else{
    tr.innerHTML=`
  <td>${r.Noido||''}</td>
  <td>${r.Nlap||''}</td>
  <td>${r.TenKH||''}</td>
  <td class="number" data-money="${r.Tongtien}">${r.Tongtien.toLocaleString('en-US')}</td>
  <td>${r.Trangthai||''}</td>
  <td class="col-web">${r.LinkTC?`<a href="${r.LinkTC}" target="_blank">${r.WebTC}</a>`:(r.WebTC||'')}</td>
  <td class="col-fkey">${FkeyText||''}</td>
  <td>${r.Congtrinh||''}</td>
  <td>${SafeLink(r.Linkview, 'xem')}</td>
  <td><input type="checkbox" class="row-check" checked onchange="SumTongtien()"></td>
  `;
    }
    tb.appendChild(tr);
  });
  document.querySelector('tfoot').style.display = 'table-footer-group'; // hiển thị dòng tổng sau khi render xong
  const master = document.getElementById('checkAll');
  if(master) master.disabled = false;
  SumTongtien();
}

/* =======================
   SUM TỔNG TIỀN
======================= */
function SumTongtien(fromHeader = false){
  const master = document.getElementById('checkAll');
  const rows = document.querySelectorAll('#tb tr .row-check');

  // ===== 1. Nếu click từ HEADER =====
  if(fromHeader && master){
    rows.forEach(cb=>{
      cb.checked = master.checked;
    });
  }

  // ===== 2. Tính SUM + đếm =====
  let sum = 0;
  let checkedCount = 0;
  let totalCount = 0;

  document.querySelectorAll('#tb tr').forEach(tr=>{
    const cb = tr.querySelector('.row-check');
    if(!cb) return;

    totalCount++;

    if(cb.checked){
      checkedCount++;
      const moneyCell = tr.querySelector('[data-money]');
      sum += Number(moneyCell?.dataset.money || 0);
    }
  });

  document.getElementById('sumTotal').textContent =
    sum.toLocaleString('en-US');

  // ===== 3. Cập nhật HEADER (Excel-like) =====
  if(master){
    if(checkedCount === 0){
      master.checked = false;
      master.indeterminate = false;
    }else if(checkedCount === totalCount){
      master.checked = true;
      master.indeterminate = false;
    }else{
      master.checked = false;
      master.indeterminate = true; // 👈 mờ
    }
  }
}

/* =======================
   FILTER
======================= */
function filter(){
    clearTimeout(filterTimer);
    filterTimer = setTimeout(function(){
    const k = search.value.trim().toLowerCase();
    if(!k){
        render(origin);
        return;
    }
    render(origin.filter(r => r._search.includes(k)));
    },180);
}

/* =======================
   READ URL PARAM
======================= */
(function(){
  const params = new URLSearchParams(window.location.search);

  const nameParam = params.get('name');
  const yearParam = params.get('year');
  const filterParam = params.get('filter');

  if(nameParam && CSV_MAP[nameParam]){
    source.value = nameParam;
  }

  if(yearParam){
    const opt = [...year.options].find(o => o.value === yearParam);
    if(opt) year.value = yearParam;
  }
  if(filterParam){
    search.value = filterParam;
}
})();

/* =======================
   DASHBOARD TAB ACTIVE
======================= */
(function(){
  const tabs = document.querySelectorAll('.tab');
  const params = new URLSearchParams(window.location.search);

  // Mặc định tab hóa đơn
  let activeTab = 'invoice';

  // Nếu sau này bạn muốn phân tab theo param
  if(params.get('page')){
    activeTab = params.get('page');
  }

  tabs.forEach(t=>{
    if(t.dataset.tab === activeTab){
      t.classList.add('active');
    }
  });
})();

window.onload=load;