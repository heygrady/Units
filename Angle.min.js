(function(n){var t,r,a,u=n.Angle={},e=["Deg","Rad","Grad","Turn"],i=[180,Math.PI,2,.5],o={},f=/^([\+\-]=)?(-?[\d+.\-]+)([a-z]+|%)(.*?)$/i,c=4;for(t=u.parseValue=function(n){var t=n.match(f);return{prefix:t[1],value:t[2],unit:t[3]}};c--;){for(a=e[c].toLowerCase(),r=e.length;r--;)r!==c&&(o[a+e[r]]=i[r]/i[c]);(function(n,r){u["to"+n]=function(a){a.unit||(a=t(a));var u=1*a.value,e=a.unit;return e===r?u:u*o[e+n]}})(e[c],a)}})(this);
/*
//@ sourceMappingURL=Angle.min.js.map
*/