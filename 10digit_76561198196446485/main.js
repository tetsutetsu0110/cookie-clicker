Game.registerMod("10digit",{//this string needs to match the ID provided in your info.txt
	init:function(){
		Game.Notify(`10digit mod loaded!`,'',[16,5]);
	},
	save:function(){
		//use this to store persistent data associated with your mod
	},
	load:function(str){
		//do stuff with the string data you saved previously
	},
});

function Beautify(value,floats)
{
    var negative=(value<0);
    var decimal='';
    if(value <= 1000000000000000000000) {
        var output=Math.trunc(value.toPrecision(10)).toLocaleString();
    } else {
        var output=Math.trunc(value.toPrecision(10));
    }
    return negative?'-'+output:output+decimal;
}