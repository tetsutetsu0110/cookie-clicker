if(OfflineLumps === undefined) var OfflineLumps = {};
// if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');

OfflineLumps.name = "offlineLumps"
OfflineLumps.launchTime = Date.now();
OfflineLumps.toString = () => "Offline Lumps"
OfflineLumps.version = 1.1
OfflineLumps.gameVersion = 2.052
OfflineLumps.lumpNames = ["Normal", "Bifurcated", "Golden", "Meaty", "Caramelized" ]

OfflineLumps.launch = function(){

	OfflineLumps.init = function() {

		OfflineLumps.config = {};
		OfflineLumps.ephemeral = {};
		
		//For save reloads without mod reloads (hot reloads?)
		CCSE.ReplaceCodeIntoFunction(
			"Game.loadLumps",
			/Game\.lumpT=Date.*?Game\.computeLumpType\(\);/s,
			"OfflineLumps.bestOfflineLump(start);",
			0
		);

		CCSE.SpliceCodeIntoFunction(
			"Game.loadLumps",
			2,
			"			let start = Game.lumpT;"
		);

		OfflineLumps.isLoaded = 1;
		Game.Notify(`${OfflineLumps} was loaded`, "", [29,16], true);
		
		// For when this mod is initially loaded (Steam save reload)
		console.log("Inspecting save");
		OfflineLumps.inspectSave();
	};

	OfflineLumps.save = function() {
		return JSON.stringify(OfflineLumps.config);
	};

	OfflineLumps.load = function(str) {
		console.log("Loaded mod data");
		var config = JSON.parse(str);
		for (var pref in config) {
			OfflineLumps.config[pref] = config[pref];
		}
	};

	OfflineLumps.grantLumps = function() {
		if (Game.lumpT > OfflineLumps.launchTime) {
			Game.Notify(`${OfflineLumps}`, `Already claimed the last sugar lump from the offline period`);
			return;
		}
		OfflineLumps.bestOfflineLump(OfflineLumps.ephemeral.lumpT);

	}

	OfflineLumps.inspectSave = function() {
		if (App) {
			App.getMostRecentSave(OfflineLumps.interpretSaveData);
		} else if (Game.useLocalStorage) {
			OfflineLumps.interpretSaveData(localStorageGet(Game.SaveTo));
		}
	}

	OfflineLumps.interpretSaveData = function(data) {
		try {
			let num = parseInt(Base64.decode(data).split("|")[4].split(";")[44]);
			if ( new Date("2013-08-07") < num && num < Date.now() ) {
				OfflineLumps.ephemeral.lumpT = num;
				OfflineLumps.grantLumps();
			} else {
				Game.Notify(`${OfflineLumps}`, `Expected a number corresponding to a date between 2013-08-08 and now but got ${num}`); 
			}
		} catch (e) {
			Game.Notify(`${OfflineLumps}`, `Could not find last lump harvest time in save data`);
		}
	};

	OfflineLumps.bestOfflineLump = function(start) {
		const lumpOverripeAge = OfflineLumps.overripeNoGod();
		let best = Game.lumpCurrentType;
		let theoT = start + lumpOverripeAge;
		while (theoT < Date.now()) {
			Game.lumpT=theoT;
			Game.computeLumpType();
			best = OfflineLumps.lumpMax(best, Game.lumpCurrentType);
			theoT += lumpOverripeAge;
		}
		Game.lumpCurrentType = best;
	}

	OfflineLumps.generateDefaultRanks = function() {
		let ranks = {};
		for (let i in OfflineLumps.lumpNames) {
			ranks[i] = (3 * i) % 7;
		}
		return ranks;
	}


	OfflineLumps.overripeNoGod=function()
	{
		var hour=1000*60*60;
		let lumpRipeAge=hour*23;
		if (Game.Has('Stevia Caelestis')) lumpRipeAge -= hour;
		if (Game.Has('Sugar aging process')) lumpRipeAge-=6000*Math.min(600,Game.Objects['Grandma'].amount);//capped at 600 grandmas
		lumpRipeAge/=1+Game.auraMult('Dragon\'s Curve')*0.05;
		let lumpOverripeAge=lumpRipeAge+hour;
		if (Game.Has('Glucose-charged air')) {lumpRipeAge/=2000;lumpOverripeAge/=2000;}
		return lumpOverripeAge;
	}

	OfflineLumps.lumpMax = function(left, right) {
		if ((3 * right) % 7 > (3 * left) % 7) return right;
		return left;
	}

	OfflineLumps.getMenuString = function() {
		let m = CCSE.MenuHelper;
	}

	if (CCSE.ConfirmGameVersion(OfflineLumps.name, OfflineLumps.version, OfflineLumps.gameVersion)) {
		Game.registerMod(OfflineLumps.name, OfflineLumps);
	}
}

if(!OfflineLumps.isLoaded){
	if(CCSE && CCSE.isLoaded){
		OfflineLumps.launch();
	}
	else{
		if(!CCSE) var CCSE = {};
		if(!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
		CCSE.postLoadHooks.push(OfflineLumps.launch);
	}
}
