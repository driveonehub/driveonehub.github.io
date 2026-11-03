const expr=document.getElementById('expr');
const out=document.getElementById('out');
let rad=false,ans=0,done=false,records=[];

function mode(on){
 document.getElementById('science').classList.toggle('show',on);
 document.getElementById('basic').classList.toggle('active',!on);
 document.getElementById('advanced').classList.toggle('active',on);
}

function angle(){
 rad=!rad;
 document.getElementById('deg').textContent=rad?'RAD':'DEG';
 preview();
}

function put(s){
 if(done && /^[0-9.]$/.test(s)) expr.value='';
 else if(done && s==='Ans') expr.value='';
 expr.value+=s;
 done=false;
 expr.focus();
 preview();
}

function clearAll(){
 expr.value='';
 out.textContent='0';
 done=false;
 expr.focus();
}

function back(){
 expr.value=expr.value.slice(0,-1);
 done=false;
 preview();
}

function factorial(n){
 if(n<0||!Number.isInteger(n)||n>170)
 throw Error('Giai thừa cần số nguyên từ 0 đến 170');
 let r=1;
 for(let i=2;i<=n;i++)r*=i;
 return r;
}

// Chỉ cho phép biểu thức toán học, không thực thi mã tùy ý.
function calculateValue(source){
 let s=source.replace(/π/g,'pi')
 .replace(/×/g,'*').replace(/÷/g,'/')
 .replace(/\s+/g,'');

 if(!s)throw Error('Hãy nhập biểu thức');
 if(!/^[0-9a-zA-Z_+\-*/^().,!%]+$/.test(s))
 throw Error('Biểu thức chứa ký tự không hợp lệ');

 // Chuyển cú pháp hiển thị thành biểu thức JavaScript.
 s=s.replace(/\bAns\b/gi,'ANS')
 .replace(/\bpi\b/gi,'PI')
 .replace(/\be\b/g,'E')
 .replace(/\^/g,'**');

 // Xử lý hàm giai thừa hậu tố.
 s=s.replace(/(\d+(?:\.\d+)?|\))!/g,'fact($1)');

 // Phần trăm dạng số đơn giản.
 s=s.replace(/(\d+(?:\.\d+)?)%/g,'($1/100)');

 const names=['sin','cos','tan','asin','acos','atan',
 'sqrt','cbrt','log','ln','abs','exp','min','max','round',
 'floor','ceil','fact'];

 const vars={
 PI:Math.PI,E:Math.E,ANS:ans,
 sin:x=>Math.sin(rad?x:x*Math.PI/180),
 cos:x=>Math.cos(rad?x:x*Math.PI/180),
 tan:x=>Math.tan(rad?x:x*Math.PI/180),
 asin:x=>Math.asin(x)*(rad?1:180/Math.PI),
 acos:x=>Math.acos(x)*(rad?1:180/Math.PI),
 atan:x=>Math.atan(x)*(rad?1:180/Math.PI),
 sqrt:Math.sqrt,cbrt:Math.cbrt,
 log:Math.log10,ln:Math.log,abs:Math.abs,exp:Math.exp,
 min:Math.min,max:Math.max,round:Math.round,
 floor:Math.floor,ceil:Math.ceil,fact:factorial
 };

 // Parser toán học giới hạn: không dùng eval hoặc Function.
 const tokens=s.match(/[A-Za-z_]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[()+\-*/%,!]/gi)||[];
 if(tokens.join('')!==s.replace(/\*\*/g,'^'))
 throw Error('Không đọc được biểu thức');

 let i=0;
 function peek(){return tokens[i]}
 function take(){return tokens[i++]}

 function primary(){
  let t=take();
  if(t==='+' )return unary();
  if(t==='-')return -unary();
  if(t==='('){
   let v=add();
   if(take()!==')')throw Error('Thiếu dấu )');
   return v;
  }
  if(!t)throw Error('Thiếu số');
  if(/^(?:\d|\.)/.test(t))return Number(t);
  if(t in vars){
   if(typeof vars[t]==='number')return vars[t];
   if(take()!=='(')throw Error('Thiếu dấu (');
   let args=[add()];
   while(peek()===','){take();args.push(add())}
   if(take()!==')')throw Error('Thiếu dấu )');
   if(!names.includes(t))throw Error('Hàm không hợp lệ');
   return vars[t](...args);
  }
  throw Error('Hàm hoặc biến không hợp lệ: '+t);
 }
 function unary(){return primary()}
 function power(){
  let a=primary();
  if(peek()==='^'){take();a=Math.pow(a,unary())}
  return a;
 }
 function mul(){
  let a=power();
  while(peek()==='*'||peek()==='/'){
   let op=take(),b=power();
   if(op==='/'&&b===0)throw Error('Không thể chia cho 0');
   a=op==='*'?a*b:a/b;
  }
  return a;
 }
 function add(){
  let a=mul();
  while(peek()==='+'||peek()==='-'){
   let op=take(),b=mul();
   a=op==='+'?a+b:a-b;
  }
  return a;
 }

 // Chuẩn hóa tên hàm và hằng số sang chữ thường cho parser.
 s=s.replace(/\*\*/g,'^');
 // Sử dụng parser riêng dưới đây với token chuẩn hóa.
 i=0;
 let value=add();
 if(i!==tokens.length)throw Error('Sai cú pháp');
 if(!Number.isFinite(value))throw Error('Kết quả không xác định');
 return value;
}

function safeCalculate(source){
 // Bộ tính dùng parser biểu thức nhỏ, không thực thi mã tùy ý.
 let s=source.replace(/π/g,'pi').replace(/×/g,'*')
 .replace(/÷/g,'/').replace(/\s+/g,'');
 s=s.replace(/\bAns\b/gi,'ans');
 const tokenPattern=/\d+(?:\.\d*)?(?:e[+-]?\d+)?|\.\d+|[a-zA-Z]+|[()+\-*/^,!%]/gi;
 const tokens=s.match(tokenPattern)||[];
 if(tokens.join('')!==s)throw Error('Sai cú pháp');
 let p=0;
 function peek(){return tokens[p]}
 function take(){return tokens[p++]}
 function expression(){
  let x=term();
  while(peek()==='+'||peek()==='-'){
   let op=take(),y=term();x=op==='+'?x+y:x-y;
  }
  return x;
 }
 function term(){
  let x=unary();
  while(peek()==='*'||peek()==='/'){
   let op=take(),y=unary();
   if(op==='/'&&y===0)throw Error('Không thể chia cho 0');
   x=op==='*'?x*y:x/y;
  }
  return x;
 }
 function unary(){
  if(peek()==='+'){take();return unary()}
  if(peek()==='-'){take();return -unary()}
  return power();
 }
 function power(){
  let x=postfix();
  if(peek()==='^'){take();x=Math.pow(x,unary())}
  return x;
 }
 function postfix(){
  let x=primary();
  while(peek()==='!'||peek()==='%'){
   let op=take();
   if(op==='!')x=factorial(x);else x/=100;
  }
  return x;
 }
 function primary(){
  let t=take();
  if(t==='('){
   let x=expression();
   if(take()!==')')throw Error('Thiếu dấu )');
   return x;
  }
  if(t===undefined)throw Error('Thiếu số');
  if(/^(?:\d|\.)/.test(t))return Number(t);
  if(/^[a-z]+$/i.test(t)){
   let n=t.toLowerCase();
   const constants={pi:Math.PI,e:Math.E,ans:ans};
   if(n in constants)return constants[n];
   const funcs={
    sin:x=>Math.sin(rad?x:x*Math.PI/180),
    cos:x=>Math.cos(rad?x:x*Math.PI/180),
    tan:x=>Math.tan(rad?x:x*Math.PI/180),
    asin:x=>Math.asin(x)*(rad?1:180/Math.PI),
    acos:x=>Math.acos(x)*(rad?1:180/Math.PI),
    atan:x=>Math.atan(x)*(rad?1:180/Math.PI),
    sqrt:Math.sqrt,cbrt:Math.cbrt,
    log:Math.log10,ln:Math.log,abs:Math.abs,exp:Math.exp,
    round:Math.round,floor:Math.floor,ceil:Math.ceil,
    min:Math.min,max:Math.max
   };
   if(!(n in funcs))throw Error('Hàm không hợp lệ: '+n);
   if(take()!=='(')throw Error('Thiếu dấu (');
   let args=[expression()];
   while(peek()===','){take();args.push(expression())}
   if(take()!==')')throw Error('Thiếu dấu )');
   if(!['min','max'].includes(n)&&args.length!==1)
   throw Error('Hàm cần một tham số');
   return funcs[n](...args);
  }
  throw Error('Biểu thức không hợp lệ');
 }
 const value=expression();
 if(p!==tokens.length)throw Error('Kiểm tra lại biểu thức');
 if(!Number.isFinite(value))throw Error('Kết quả không xác định');
 return value;
}

function preview(){
 if(!expr.value.trim()){out.textContent='0';return}
 try{
  out.textContent=Number(safeCalculate(expr.value).toPrecision(12)).toString();
 }catch(e){out.textContent='…'}
}

function calculate(){
 try{
  let v=safeCalculate(expr.value);
  ans=v;
  out.textContent=Number(v.toPrecision(12)).toString();
  records.unshift(expr.value+' = '+out.textContent);
  records=records.slice(0,30);
  document.getElementById('history').textContent=records.join('\n');
  document.getElementById('history').style.whiteSpace='pre-line';
  done=true;
 }catch(e){out.textContent=e.message}
}

function clearHistory(){
 records=[];
 document.getElementById('history').textContent='';
}

async function copyResult(){
 try{await navigator.clipboard.writeText(out.textContent)}
 catch(e){out.textContent=out.textContent}
}

expr.addEventListener('input',()=>{done=false;preview()});
expr.addEventListener('keydown',e=>{
 if(e.key==='Enter'||e.key==='='){e.preventDefault();calculate()}
 if(e.key==='Escape')clearAll();
});
document.addEventListener('keydown',e=>{
 if(document.activeElement===expr||e.ctrlKey||e.altKey||e.metaKey)return;
 if(/^[0-9.+\-*/^()%!]$/.test(e.key))put(e.key);
 if(e.key==='Enter')calculate();
 if(e.key==='Backspace')back();
 if(e.key==='Escape')clearAll();
});

/* ===DASHBOARD TAB ACTIVE=== */
(function(){
  const tabs = document.querySelectorAll('.tab');
  const params = new URLSearchParams(window.location.search);

  // Mặc định tab hóa đơn
  let activeTab = 'calculate';

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
/* ===END DASHBOARD TAB ACTIVE=== */