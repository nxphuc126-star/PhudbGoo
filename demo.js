// Các ô "Thử ngay" mô phỏng kết quả chạy Python
const $ = id => document.getElementById(id);

// Biến
function renderBien() {
  const ten = $('v-ten').value;
  const tuoi = parseInt($('v-tuoi').value, 10) || 0;
  $('v-out').textContent =
    'ten = "' + ten + '"\ntuoi = ' + tuoi +
    '\nprint(ten, tuoi)  →  ' + ten + ' ' + tuoi +
    '\ntuoi = tuoi + 1\nprint(tuoi)  →  ' + (tuoi + 1);
}

// input() + print()
function renderInput() {
  const tuoi = parseInt($('n-tuoi').value, 10);
  $('n-out').textContent = Number.isNaN(tuoi)
    ? 'ValueError: không đổi được chuỗi rỗng sang số nguyên'
    : 'Nhập tuổi của bạn: ' + tuoi + '\nNăm sau bạn ' + (tuoi + 1) + ' tuổi';
}

// if – elif – else
function renderIf() {
  const diem = parseFloat($('i-diem').value);
  if (Number.isNaN(diem)) { $('i-out').textContent = 'Hãy nhập một số từ 0 đến 10.'; return; }
  const kq = diem >= 8 ? 'Giỏi' : diem >= 6.5 ? 'Khá' : diem >= 5 ? 'Trung bình' : 'Yếu';
  $('i-out').textContent = 'diem = ' + diem + '\nprint → ' + kq;
}

$('v-ten').addEventListener('input', renderBien);
$('v-tuoi').addEventListener('input', renderBien);
$('n-tuoi').addEventListener('input', renderInput);
$('i-diem').addEventListener('input', renderIf);
renderBien(); renderInput(); renderIf();
