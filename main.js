!function()
{
	Game.registerMod("autosacrifice",
	{
		auto_sac_enabled: false,
		do_convert: false,
		avoid_cps_buffs: false,
		allow_frenzies: false,
		do_soil_rotation: false,
		
		hook_added: false,
		last_time_called_from_buff_end: 0,
		
		auto_sac_button: null,
		do_convert_button: null,
		avoid_cps_buffs_button: null,
		allow_frenzies_button: null,
		do_soil_rotation_button: null,
		
		init: function()
		{
			Game.Notify('Auto Sacrifice Loaded!',`Enable it with the button at the bottom of the options menu.`, [16, 6], 5);
			
			let MOD = this;
			
			let menu = Game.UpdateMenu;
			
			Game.UpdateMenu = function()
			{
				menu();
				
				if (Game.onMenu == 'prefs')
				{
					document.querySelector("#screenreaderButton").nextElementSibling.nextElementSibling.insertAdjacentHTML("afterend", `
						<a class="smallFancyButton prefButton option ${MOD.auto_sac_enabled ? "on" : "off"}" id="auto-sac-button" onclick="Game.toggle_auto_sac()">AutoSacrifice ${MOD.auto_sac_enabled ? "ON" : "OFF"}</a>
						<label>(the global on/off switch for the AutoSacrifice mod. Makes the garden fully automatic, from planting to harvesting to sacrificing. None of the below four options have any effect if this is off.)</label>
						<br>
						
						<a class="smallFancyButton prefButton option ${MOD.do_convert ? "on" : "off"}" id="do-convert-button" onclick="Game.toggle_do_convert()">Auto convert ${MOD.do_convert ? "ON" : "OFF"}</a>
						<label>(automatically convert the garden; turn off if you want the seeds but not the lumps)</label>
						<br>
						
						<a class="smallFancyButton prefButton option ${MOD.avoid_cps_buffs ? "on" : "off"}" id="avoid-cps-buffs-button" onclick="Game.toggle_avoid_cps_buffs()">Avoid CpS buffs ${MOD.avoid_cps_buffs ? "ON" : "OFF"}</a>
						<label>(skip planting seeds if a buff is currently active; ignores loans)</label>
						<br>
						
						<a class="smallFancyButton prefButton option ${MOD.allow_frenzies ? "on" : "off"}" id="allow-frenzies-button" onclick="Game.toggle_allow_frenzies()">Tolerate frenzies ${MOD.allow_frenzies ? "ON" : "OFF"}</a>
						<label>(still plant seeds during regular 7x frenzies; has no effect if the previous option is off)</label>
						<br>
						
						<a class="smallFancyButton prefButton option ${MOD.do_soil_rotation ? "on" : "off"}" id="do-soil-rotation-button" onclick="Game.toggle_do_soil_rotation()">Auto rotate soil ${MOD.do_soil_rotation ? "ON" : "OFF"}</a>
						<label>(automatically switch between fertilizer and wood chips)</label>
						<br>
					`);
					
					setTimeout(() =>
					{
						MOD.auto_sac_button = l("auto-sac-button");
						MOD.do_convert_button = l("do-convert-button");
						MOD.avoid_cps_buffs_button = l("avoid-cps-buffs-button");
						MOD.allow_frenzies_button = l("allow-frenzies-button");
						MOD.do_soil_rotation_button = l("do-soil-rotation-button");
					}, 50);
				}
			};
            
            
            
            Game.updateBuffs=function()//executed every logic frame
            {
                for (var i in Game.buffs)
                {
                    var buff=Game.buffs[i];
                    
                    if (buff.time>=0)
                    {
                        if (!l('buffPieTimer'+buff.id)) l('buff'+buff.id).innerHTML=l('buff'+buff.id).innerHTML+'<div class="pieTimer" id="buffPieTimer'+buff.id+'"></div>';
                        var T=1-(buff.time/buff.maxTime);
                        T=(T*144)%144;
                        l('buffPieTimer'+buff.id).style.backgroundPosition=(-Math.floor(T%18))*48+'px '+(-Math.floor(T/18))*48+'px';
                    }
                    buff.time--;
                    if (buff.time<=0)
                    {
                        if (Game.onCrate==l('buff'+buff.id)) Game.tooltip.hide();
                        if (buff.onDie) buff.onDie();
                        Game.buffsL.removeChild(l('buff'+buff.id));
                        if (Game.buffs[buff.name])
                        {
                            Game.buffs[buff.name]=0;
                            delete Game.buffs[buff.name];
                        }
                        Game.recalculateGains=1;
                        Game.storeToRefresh=1;
                        
                        if (MOD.auto_sac_enabled && Date.now() - MOD.last_time_called_from_buff_end > 10000)
                        {
                        		MOD.last_time_called_from_buff_end = Date.now();
                        		
                            MOD.post_tick_logic();
                        }
                    }
                }
            }
            
            
			
			Game.toggle_auto_sac = function()
			{
				MOD.auto_sac_enabled = !MOD.auto_sac_enabled;
				
				if (!MOD.auto_sac_enabled)
				{
					try
					{
						MOD.auto_sac_button.textContent = "AutoSacrifice OFF";
						MOD.auto_sac_button.classList.remove("on");
						MOD.auto_sac_button.classList.add("off");
					}
					
					catch(ex) {}
					
					if (MOD.do_convert)
					{
						Game.toggle_do_convert();
					}
					
					if (MOD.avoid_cps_buffs)
					{
						Game.toggle_avoid_cps_buffs();
					}
					
					if (MOD.allow_frenzies)
					{
						Game.toggle_allow_frenzies();
					}
					
					if (MOD.do_soil_rotation)
					{
						Game.toggle_do_soil_rotation();
					}
				}
				
				else
				{
					try
					{
						MOD.auto_sac_button.textContent = "AutoSacrifice ON";
						MOD.auto_sac_button.classList.remove("off");
						MOD.auto_sac_button.classList.add("on");
					}
					
					catch(ex) {}
					
					if (!MOD.do_convert)
					{
						Game.toggle_do_convert();
					}
					
					if (!MOD.do_soil_rotation)
					{
						Game.toggle_do_soil_rotation();
					}
				}
				
				MOD.add_hook();
			};
			
			Game.toggle_do_convert = function()
			{
				MOD.do_convert = !MOD.do_convert;
				
				try
				{
					if (!MOD.do_convert)
					{
						MOD.do_convert_button.textContent = "Auto convert OFF";
						MOD.do_convert_button.classList.remove("on");
						MOD.do_convert_button.classList.add("off");
					}
					
					else
					{
						MOD.do_convert_button.textContent = "Auto convert ON";
						MOD.do_convert_button.classList.remove("off");
						MOD.do_convert_button.classList.add("on");
					}
				}
				
				catch(ex) {}
			};
			
			Game.toggle_avoid_cps_buffs = function()
			{
				MOD.avoid_cps_buffs = !MOD.avoid_cps_buffs;
				
				try
				{
					if (!MOD.avoid_cps_buffs)
					{
						MOD.avoid_cps_buffs_button.textContent = "Avoid CpS buffs OFF";
						MOD.avoid_cps_buffs_button.classList.remove("on");
						MOD.avoid_cps_buffs_button.classList.add("off");
					}
					
					else
					{
						MOD.avoid_cps_buffs_button.textContent = "Avoid CpS buffs ON";
						MOD.avoid_cps_buffs_button.classList.remove("off");
						MOD.avoid_cps_buffs_button.classList.add("on");
					}
				}
				
				catch(ex) {}
			};
			
			Game.toggle_allow_frenzies = function()
			{
				MOD.allow_frenzies = !MOD.allow_frenzies;
				
				try
				{
					if (!MOD.allow_frenzies)
					{
						MOD.allow_frenzies_button.textContent = "Tolerate frenzies OFF";
						MOD.allow_frenzies_button.classList.remove("on");
						MOD.allow_frenzies_button.classList.add("off");
					}
					
					else
					{
						MOD.allow_frenzies_button.textContent = "Tolerate frenzies ON";
						MOD.allow_frenzies_button.classList.remove("off");
						MOD.allow_frenzies_button.classList.add("on");
					}
				}
				
				catch(ex) {}
			};
			
			Game.toggle_do_soil_rotation = function()
			{
				MOD.do_soil_rotation = !MOD.do_soil_rotation;
				
				try
				{
					if (!MOD.do_soil_rotation)
					{
						MOD.do_soil_rotation_button.textContent = "Auto rotate soil OFF";
						MOD.do_soil_rotation_button.classList.remove("on");
						MOD.do_soil_rotation_button.classList.add("off");
					}
					
					else
					{
						MOD.do_soil_rotation_button.textContent = "Auto rotate soil ON";
						MOD.do_soil_rotation_button.classList.remove("off");
						MOD.do_soil_rotation_button.classList.add("on");
					}
				}
				
				catch(ex) {}
			};
		},
		
		
		
		save: function()
		{
			return `${this.fertilizer_ticks}|${this.woodchips_ticks}|${this.auto_sac_enabled ? 1 : 0}|${this.do_convert ? 1 : 0}|${this.avoid_cps_buffs ? 1 : 0}|${this.do_soil_rotation ? 1 : 0}|${this.allow_frenzies ? 1 : 0}`;
		},
		
		
		
		load: function(str)
		{
			if (str.indexOf("|") === -1)
			{
				this.fertilizer_ticks = 0;
				this.woodchips_ticks = 0;
				
				return;
			}
			
			let components = str.split("|");
			
			this.fertilizer_ticks = parseInt(components[0]);
			this.woodchips_ticks = parseInt(components[1]);
			
			setTimeout(() =>
			{
				if (components.length > 2 && !!parseInt(components[2]) !== this.auto_sac_enabled)
				{
					Game.toggle_auto_sac();
				}
				
				if (components.length > 3 && !!parseInt(components[3]) !== this.do_convert)
				{
					Game.toggle_do_convert();
				}
				
				if (components.length > 4 && !!parseInt(components[4]) !== this.avoid_cps_buffs)
				{
					Game.toggle_avoid_cps_buffs();
				}
				
				if (components.length > 5 && !!parseInt(components[5]) !== this.do_soil_rotation)
				{
					Game.toggle_do_soil_rotation();
				}
				
				if (components.length > 6 && !!parseInt(components[6]) !== this.allow_frenzies)
				{
					Game.toggle_allow_frenzies();
				}
			}, 1000);
		},
		
		
		
		add_hook: function()
		{
			if (this.hook_added)
			{
				return;
			}
			
			this.hook_added = true;
			
			let MOD = this;
			
			let build_plot = Game.ObjectsById[2].minigame.buildPlot;
			
			Game.ObjectsById[2].minigame.buildPlot = function()
			{
				build_plot();
				
				if (MOD.auto_sac_enabled)
				{
					MOD.post_tick_logic();
				}
			};
		},
		
		
		
		seed_order:
		[
			"meddleweed",
			
			"bakeberry",
			"thumbcorn",
			"cronerice",
			
			"crumbspore",
			"brownMold",
			"whiteMildew",
			"chocoroot",
			"queenbeet",
			"queenbeetLump",
			
			"gildmillet",
			"clover",
			"greenRot",
			"shimmerlily",
			
			"elderwort",
			
			"keenmoss",
			"drowsyfern",
			"wardlichen",
			
			"whiteChocoroot",
			"tidygrass",
			
			"everdaisy",
			"ichorpuff",
			
			"doughshroom",
			"wrinklegill",
			"glovemorel",
			"cheapcap",
			"foolBolete",
			
			"whiskerbloom",
			"chimerose",
			"nursetulip",
			
			"duketater",
			"shriekbulb",
			
			"goldenClover"
		],
		
		seed_to_unlock: "",
		secondary_targets: {},
		
		
		
		//The type is 0 for 2x of one plant, 1 for 2 different plants, and 2 for a weird setup that must be explicitly defined.
		mutation_setups:
		{
			thumbcorn:
			{
				id: 1,
				type: 0,
				parents: ["bakerWheat"]
			},
			
			bakeberry:
			{
				id: 8,
				type: 0,
				parents: ["bakerWheat"],
				try_without_replanting: ["queenbeet"],
				try_without_replanting_partner: ["chocoroot"]
			},
			
			whiteMildew:
			{
				id: 11,
				type: 0,
				parents: ["brownMold"]
			},
			
			doughshroom:
			{
				id: 24,
				type: 0,
				parents: ["crumbspore"]
			},
			
			duketater:
			{
				id: 22,
				type: 0,
				parents: ["queenbeet"]
			},
			
			nursetulip:
			{
				id: 16,
				type: 0,
				parents: ["whiskerbloom"]
			},
			
			goldenClover:
			{
				id: 5,
				type: 0,
				parents: ["clover"],
				
				tiles: [[0, 0], [0, 2], [0, 5], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 0], [2, 1], [3, 4], [3, 5], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [5, 0], [5, 3], [5, 5]],
			
				empty_tiles: [[0, 1], [0, 3], [0, 4], [1, 0], [2, 2], [2, 3], [2, 4], [2, 5], [3, 0], [3, 1], [3, 2], [3, 3], [4, 5], [5, 1], [5, 2], [5, 4]]
			},
			
			queenbeetLump:
			{
				id: 21,
				type: 0,
				parents: ["queenbeet"],
				
				tiles: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 0], [1, 2], [1, 4], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [3, 0], [3, 2], [3, 4], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4]],
			
				empty_tiles: [[1, 1], [1, 3], [3, 1], [3, 3]]
			},
			
			shriekbulb:
			{
				id: 30,
				type: 0,
				parents: ["duketater"],
			},
			
			
			
			cronerice:
			{
				id: 2,
				type: 1,
				parents: ["thumbcorn", "bakerWheat"],
				try_without_replanting: ["gildmillet"],
				try_without_replanting_partner: ["thumbcorn"]
			},
			
			gildmillet:
			{
				id: 3,
				type: 1,
				parents: ["thumbcorn", "cronerice"],
				try_without_replanting: ["clover"],
				try_without_replanting_partner: ["bakerWheat"]
			},
			
			chocoroot:
			{
				id: 9,
				type: 1,
				parents: ["bakerWheat", "brownMold"],
				try_without_replanting: ["whiteChocoroot"],
				try_without_replanting_partner: ["whiteMildew"]
			},
			
			wrinklegill:
			{
				id: 28,
				type: 1,
				parents: ["brownMold", "crumbspore"]
			},
			
			glovemorel:
			{
				id: 25,
				type: 1,
				parents: ["thumbcorn", "crumbspore"]
			},
			
			clover:
			{
				id: 4,
				type: 1,
				parents: ["bakerWheat", "gildmillet"],
				try_without_replanting: ["shimmerlily", "greenRot"],
				try_without_replanting_partner: ["gildmillet", "whiteMildew"]
			},
			
			queenbeet:
			{
				id: 20,
				type: 1,
				parents: ["chocoroot", "bakeberry"]
			},
			
			whiteChocoroot:
			{
				id: 10,
				type: 1,
				parents: ["whiteMildew", "chocoroot"]
			},
			
			wardlichen:
			{
				id: 18,
				type: 1,
				parents: ["keenmoss", "cronerice"]
			},
			
			shimmerlily:
			{
				id: 6,
				type: 1,
				parents: ["gildmillet", "clover"]
			},
			
			tidygrass:
			{
				id: 31,
				type: 1,
				parents: ["bakerWheat", "whiteChocoroot"]
			},
			
			greenRot:
			{
				id: 29,
				type: 1,
				parents: ["whiteMildew", "clover"]
			},
			
			elderwort:
			{
				id: 7,
				type: 1,
				parents: ["shimmerlily", "cronerice"]
			},
			
			whiskerbloom:
			{
				id: 14,
				type: 1,
				parents: ["whiteChocoroot", "shimmerlily"]
			},
			
			cheapcap:
			{
				id: 26,
				type: 1,
				parents: ["shimmerlily", "crumbspore"]
			},
			
			keenmoss:
			{
				id: 19,
				type: 1,
				parents: ["greenRot", "brownMold"]
			},
			
			foolBolete:
			{
				id: 27,
				type: 1,
				parents: ["greenRot", "doughshroom"]
			},
			
			chimerose:
			{
				id: 15,
				type: 1,
				parents: ["shimmerlily", "whiskerbloom"]
			},
			
			drowsyfern:
			{
				id: 17,
				type: 1,
				parents: ["chocoroot", "keenmoss"]
			},
			
			ichorpuff:
			{
				id: 33,
				type: 1,
				parents: ["crumbspore", "elderwort"],
				
				fast_tiles: [[1, 1], [1, 4], [5, 1], [5, 4]],
				
				slow_tiles: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5]],
			
				empty_tiles: [[1, 0], [1, 2], [1, 3], [1, 5], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [5, 0], [5, 2], [5, 3], [5, 5]]
			},
			
			everdaisy:
			{
				id: 32,
				type: 1,
				parents: ["tidygrass", "elderwort"],
				
				fast_tiles: [[1, 0], [1, 2], [1, 3], [1, 5], [2, 0], [2, 2], [2, 5], [4, 0], [4, 5], [5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5]],
				
				slow_tiles: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5]],
			
				empty_tiles: [[1, 1], [1, 4], [2, 1], [2, 3], [2, 4], [4, 1], [4, 2], [4, 3], [4, 4]]
			},
			
			
			
			bakerWheat:
			{
				id: 0
			},
			
			meddleweed:
			{
				id: 13,
				type: 2,
				parents: []
			},
			
			brownMold:
			{
				id: 12,
				type: 2,
				parents: ["meddleweed"],
				try_without_replanting: ["whiteMildew"],
				try_without_replanting_partner: [""]
			},
			
			crumbspore:
			{
				id: 23,
				type: 2,
				parents: ["meddleweed"],
				try_without_replanting: ["wrinklegill", "glovemorel"],
				try_without_replanting_partner: ["brownMold", "thumbcorn"]
			}
		},
		
		
		
		fertilizer_ticks: 0,
		woodchips_ticks: 0,
		
		last_fertilizer_ticks: 0,
		last_woodchips_ticks: 0,
		
		num_iterations: -1,
		
		post_tick_logic: function()
		{
			//Debug for testing
			/*
			Game.ObjectsById[2].minigame.soils["fertilizer"].tick = .0005;
			Game.ObjectsById[2].minigame.soils["woodchips"].tick = .0005;
			Game.ObjectsById[2].minigame.nextSoil = 0;
			*/
			
			if (Game.ObjectsById[2].minigame.soil === 1)
			{
				this.fertilizer_ticks++;
			}
			
			else
			{
				this.woodchips_ticks++;
			}
			
			
			
			if (this.ticks_until_fast_plants > 0)
			{
				this.ticks_until_fast_plants--;
			}
			
			
			
			//If we find what we're looking for, we switch to fertilizer, and then clear the plot.
			let found_target = this.find_target();
			
			if (found_target)
			{
				this.change_soil(1);
				
				this.ticks_until_fast_plants = -1;
			}
			
			
			
			this.handle_secondary_targets();
			
			this.add_elderwort();
			
			this.select_next_target();
			
			let arg = this.seed_to_unlock === "queenbeetLump" ? 1 : 0;
			
			if (arg)
			{
				this.fertilizer_requests = 0;
			}
			
			this.remove_unlocked_plants(false, arg);
			
			this.remove_non_unlocked_duplicates();
            
            
            
			//Sometimes we may be in a state where we don't have the ability to grow anything cause we're waiting on a ton of stuff to grow.
			if (this.seed_to_unlock === "")
			{
                //If there's only one seed to unlock and it's present, change to fertilizer and return.
                let num_not_unlocked = 0;
                
                for (let i = 0; i < this.seed_order.length; i++)
                {
                    if (!Game.ObjectsById[2].minigame.plants[this.seed_order[i]].unlocked)
                    {
                        num_not_unlocked++;
                    }
                }
                
                if (num_not_unlocked === 1)
                {
                    let id = this.mutation_setups[this.seed_order[i]].id;
				
                    let currently_growing = false;
                    
                    for (let i = 0; i < 6; i++)
                    {
                        for (let j = 0; j < 6; j++)
                        {
                            if (Game.ObjectsById[2].minigame.plot[i][j][0] - 1 === id)
                            {
                                currently_growing = true;
                                
                                break;
                            }
                        }
                        
                        if (currently_growing)
                        {
                            break;
                        }
                    }
                    
                    if (currently_growing)
                    {
                        this.change_soil(1);
                    }
                }
                
				return;
			}
			
			
			
			let setup = this.mutation_setups[this.seed_to_unlock];
			
			if (setup.type === 0)
			{
				this.unlock_type_0_logic(...(setup.parents));
			}
			
			else if (setup.type === 1)
			{
				this.unlock_type_1_logic(...(setup.parents));
			}
			
			
			
			if (this.seed_to_unlock === "meddleweed")
			{
				this.unlock_meddleweed_logic();
			}
			
			else if (this.seed_to_unlock === "crumbspore" || this.seed_to_unlock === "brownMold")
			{
				this.unlock_crumbspore_brownMold_logic();
				
				this.remove_non_unlocked_duplicates();
			}
			
			else if (this.seed_to_unlock === "shriekbulb")
			{
				this.change_soil(4);
			}
			
			else if (this.seed_to_unlock === "queenbeetLump")
			{
				if (!Game.ObjectsById[2].minigame.plants["elderwort"].unlocked)
				{
					this.select_next_target(true);
					
					if (this.seed_to_unlock === "")
					{
						if (this.fertilizer_requests > 0)
						{
							this.change_soil(1);
						}
						
						return;
					}
					
					this.remove_unlocked_plants(false, 2);
					
					let setup = this.mutation_setups[this.seed_to_unlock];
					
					if (setup.type === 0)
					{
						this.unlock_type_0_logic(...(setup.parents), [[0, 5], [2, 5], [4, 5], [5, 0], [5, 2], [5, 4]], [[1, 5], [3, 5], [5, 1], [5, 3], [5, 5]]);
					}
					
					else if (setup.type === 1)
					{
						this.unlock_type_1_logic(...(setup.parents), [[0, 5], [4, 5], [5, 2]], [[2, 5], [5, 0], [5, 4]], [[1, 5], [3, 5], [5, 1], [5, 3], [5, 5]]);
					}
					
					if (this.fertilizer_requests === 2)
					{
						this.change_soil(1);
					}
				}
			}
            
            
            
            //Update the garden text.
            let elements = document.querySelectorAll("#AUTOSAC-new-line-break, #AUTOSAC-garden-text");
            
            let text = this.seed_to_unlock === "" ? "Nothing" : Game.ObjectsById[2].minigame.plants[this.seed_to_unlock].name;
            
            if (elements.length < 2)
            {
                try
                {
                    document.querySelector("#gardenSeeds").insertAdjacentHTML("afterend", `<div id="AUTOSAC-new-line-break" class="line"></div><div id="AUTOSAC-garden-text" class="title gardenPanelLabel">Targeting ${text}</div>`);
                }
                
                catch(ex) {}
            }
            
            else
            {
                elements[1].textContent = `Targeting ${text}`;
            }
		},
		
		
		
		need_woodchips_for_secondary_target: false,
		
		//Deals with plants where we attempt to parlay them directly into new mutations.
		handle_secondary_targets: function()
		{
			this.need_woodchips_for_secondary_target = false;
			
			for (let key in this.secondary_targets)
			{
				let source_tile = this.secondary_targets[key].source_tile;
				let source_key = this.secondary_targets[key].source_key;
				
				
				
				let mutation_tiles = this.secondary_targets[key].mutation_tiles;
				
				let mutation_happened = false;
				
				for (let i = 0; i < mutation_tiles.length; i++)
				{
					let id = Game.ObjectsById[2].minigame.plot[mutation_tiles[i][0]][mutation_tiles[i][1]][0] - 1;
					
					if (id === this.mutation_setups[key].id)
					{
						mutation_happened = true;
						break;
					}
				}
				
				
				
				if (mutation_happened || Game.ObjectsById[2].minigame.plants[key].unlocked || Game.ObjectsById[2].minigame.plot[source_tile[0]][source_tile[1]][0] - 1 !== this.mutation_setups[source_key].id)
				{
					delete this.secondary_targets[key];
					continue;
				}
				
				if (this.secondary_targets[key].ticks_to_wait !== 0)
				{
					this.secondary_targets[key].ticks_to_wait--;
				}
				
				if (this.secondary_targets[key].ticks_to_wait === 0)
				{
					let tiles = this.secondary_targets[key].tiles;
					let key_to_plant = this.secondary_targets[key].key_to_plant;
					
					if (key_to_plant === "")
					{
						continue;
					}
					
					for (let i = 0; i < tiles.length; i++)
					{
						if (Game.ObjectsById[2].minigame.plot[tiles[i][0]][tiles[i][1]][0] === 0)
						{
							this.plant_seed(this.mutation_setups[key_to_plant].id, tiles[i][1], tiles[i][0]);
						}
					}
				}
				
				if (Game.ObjectsById[2].minigame.plot[source_tile[0]][source_tile[1]][1] >= Game.ObjectsById[2].minigame.plants[source_key].mature)
				{
					let mature = 0;
					
					let tiles = this.secondary_targets[key].tiles;
					let key_to_plant = this.secondary_targets[key].key_to_plant;
					
					if (key_to_plant === "")
					{
						continue;
					}
					
					for (let i = 0; i < tiles.length; i++)
					{
						if (Game.ObjectsById[2].minigame.plot[tiles[i][0]][tiles[i][1]][1] === Game.ObjectsById[2].minigame.plants[key_to_plant].mature)
						{
							mature++;
						}
					}
					
					if (mature > tiles.length / 2)
					{
						this.need_woodchips_for_secondary_target = true;
						this.change_soil(4);
					}	
				}
			}
		},
		
		
		
		//When there's just a JQB or Everdaisy left growing, surround it with Elderwort.
		add_elderwort: function()
		{
			for (let i = 0; i < 6; i++)
			{
				for (let j = 0; j < 6; j++)
				{
					let id = Game.ObjectsById[2].minigame.plot[i][j][0] - 1;
					
					if (id === this.mutation_setups["queenbeetLump"].id)
					{
						//These two never occur in the outer edge of the garden, so we can skip inbounds checks.
						for (let k = -1; k <= 1; k++)
						{
							for (let l = -1; l <= 1; l++)
							{
								if (Game.ObjectsById[2].minigame.plot[i + k][j + l][0] === 0)
								{
									this.plant_seed(this.mutation_setups["elderwort"].id, j + l, i + k);
								}
							}
						}
					}
				}
			}
		},
		
		
		
		last_notification: "",
		notified_jqb: false,
		
		//Find the first non-unlocked seed and target it.
		select_next_target: function(ignore_jqb = false)
		{
			this.seed_to_unlock = "";
			
			for (let i = 0; i < this.seed_order.length; i++)
			{
				if (Game.ObjectsById[2].minigame.plants[this.seed_order[i]].unlocked)
				{
					continue;
				}
				
				if (ignore_jqb && (this.seed_order[i] === "shriekbulb" || typeof this.mutation_setups[this.seed_order[i]].empty_tiles !== "undefined"))
				{
					continue;
				}
				
				
				
				let parents = this.mutation_setups[this.seed_order[i]].parents;
				
				if (parents.length > 0 && !Game.ObjectsById[2].minigame.plants[parents[0]].unlocked)
				{
					continue;
				}
				
				if (parents.length > 1 && !Game.ObjectsById[2].minigame.plants[parents[1]].unlocked)
				{
					continue;
				}
				
				let id = this.mutation_setups[this.seed_order[i]].id;
				
				let currently_growing = false;
				
				for (let i = 0; i < 6; i++)
				{
					for (let j = 0; j < 6; j++)
					{
						if (Game.ObjectsById[2].minigame.plot[i][j][0] - 1 === id)
						{
							currently_growing = true;
							
							break;
						}
					}
					
					if (currently_growing)
					{
						break;
					}
				}
				
				if (currently_growing)
				{
					continue;
				}
				
				this.seed_to_unlock = this.seed_order[i];
				
				if (this.seed_to_unlock !== this.last_notification)
				{
					if (this.seed_to_unlock === "queenbeetLump")
					{
						if (this.notified_jqb)
						{
							return;
						}
						
						this.notified_jqb = true;
					}
					
					this.last_notification = this.seed_to_unlock;
					
					Game.Notify('Auto Sacrifice', `Targeting ${Game.ObjectsById[2].minigame.plants[this.seed_order[i]].name}`, [15, 6], Infinity);
					
					this.ticks_until_fast_plants = -1;
					
					//An unfortunate edge case: we go from all wheat to half corn and half wheat, and so without this, we have to wait for the wheat to decay first.
					if (this.seed_to_unlock === "cronerice")
					{
						this.remove_unlocked_plants(true);
					}
				}
				
				break;
			}
			
			
			
			if (this.seed_to_unlock === "" && !ignore_jqb)
			{
				//Possibly time to sacrifice!
				for (let i = 0; i < this.seed_order.length; i++)
				{
					if (!Game.ObjectsById[2].minigame.plants[this.seed_order[i]].unlocked)
					{
						return;
					}
				}
				
				if (!this.do_convert)
				{
					return;
				}
				
				Game.ObjectsById[2].minigame.convert();
				
				this.seed_to_unlock = "meddleweed";
				
				
				
				this.mutation_setups["queenbeetLump"] =
				{
					id: 21,
					type: 0,
					parents: ["queenbeet"],
					
					tiles: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 0], [1, 2], [1, 4], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [3, 0], [3, 2], [3, 4], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4]],
				
					empty_tiles: [[1, 1], [1, 3], [3, 1], [3, 3]]
				};
				
				
				
				this.num_iterations++;
				
				if (this.num_iterations === 0)
				{
					this.fertilizer_ticks = 0;
					this.woodchips_ticks = 0;
				}
				
				else
				{
					console.log(`Sacrificed in ${this.fertilizer_ticks - this.last_fertilizer_ticks} fertilizer ticks and ${this.woodchips_ticks - this.last_woodchips_ticks} woodchips ticks. Current average of ${this.num_iterations} runs: ${Math.round(this.fertilizer_ticks / this.num_iterations)}, ${Math.round(this.woodchips_ticks / this.num_iterations)}`);
					
					this.last_fertilizer_ticks = this.fertilizer_ticks;
					this.last_woodchips_ticks = this.woodchips_ticks;
				}
				
				Game.Notify('Auto Sacrifice', `Targeting ${Game.ObjectsById[2].minigame.plants[this.seed_order[0]].name}`, [15, 6], Infinity);
			}
		},
		
		
		
		//Harvests plants that are not unlocked and either about to die or mature without a parlay. If there is a parlay, it sets that up.
		find_target: function()
		{
			let found_target = false;
			
			for (let i = 0; i < 6; i++)
			{
				for (let j = 0; j < 6; j++)
				{
					let tile = Game.ObjectsById[2].minigame.plot[i][j];
					
					if (tile[0] === 0)
					{
						continue;
					}
					
					let plant = Game.ObjectsById[2].minigame.plantsById[tile[0] - 1];
					
					if (plant.key === this.seed_to_unlock)
					{
						found_target = true;
					}
					
					
					
					if (!Game.ObjectsById[2].minigame.plants[plant.key].unlocked && tile[1] >= plant.mature && (tile[1] >= 85 || typeof this.mutation_setups[plant.key].try_without_replanting === "undefined" || this.mutation_setups[plant.key].try_without_replanting.length === 0))
					{
						this.harvest_plant(j, i);
					}
						
					else if (typeof this.mutation_setups[plant.key].try_without_replanting !== "undefined" && this.mutation_setups[plant.key].try_without_replanting.length !== 0)
					{
						for (let k = 0; k < this.mutation_setups[plant.key].try_without_replanting.length; k++)
						{
							let key = this.mutation_setups[plant.key].try_without_replanting[k];
							
							if (typeof this.secondary_targets[key] === "undefined")
							{
								let tiles = [];
								
								if (this.mutation_setups[plant.key].try_without_replanting.length === 1)
								{
									tiles = [[i - 2, j], [i + 2, j], [i, j - 2], [i, j + 2]];
								}
								
								else if (k === 0)
								{
									tiles = [[i - 2, j], [i + 2, j]];
								}
								
								else
								{
									tiles = [[i, j - 2], [i, j + 2]];
								}
								
								
								
								for (let l = 0; l < tiles.length; l++)
								{
									if (tiles[l][0] < 0 || tiles[l][0] > 5 || tiles[l][1] < 0 || tiles[l][1] > 5)
									{
										tiles.splice(l, 1);
										l--;
									}
								}
								
								//This is a little annoying -- it's hard to not get duplicates, so we need an intermediate step.
								let mutation_tiles_validity = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
								
								for (let l = 0; l < tiles.length; l++)
								{
									mutation_tiles_validity[(tiles[l][0] - i) / 2 + 1][(tiles[l][0] - j) / 2 + 1] = 1;
								}
								
								let mutation_tiles = [];
								
								for (let l = 0; l < 3; l++)
								{
									for (let m = 0; m < 3; m++)
									{
										let row = i + l - 1;
										let col = j + m - 1;
										
										if (mutation_tiles_validity[l][m] && row >= 0 && row < 5 && col > 0 && col < 5)
										{
											mutation_tiles.push([row, col]);
										}
									}
								}
								
								
								
								let key_to_plant = this.mutation_setups[plant.key].try_without_replanting_partner[k];	
								
								let ticks_to_wait = 0;
								
								if (key_to_plant !== "")
								{
									let fast_ticks = Game.ObjectsById[2].minigame.plants[key_to_plant].mature / (Game.ObjectsById[2].minigame.plants[key_to_plant].ageTick + Game.ObjectsById[2].minigame.plants[key_to_plant].ageTickR / 2);
				
									let slow_ticks = Game.ObjectsById[2].minigame.plants[plant.key].mature / (Game.ObjectsById[2].minigame.plants[plant.key].ageTick + Game.ObjectsById[2].minigame.plants[plant.key].ageTickR / 2);
									
									ticks_to_wait = Math.max(Math.floor(slow_ticks - fast_ticks), 0);
								}
								
								
								
								this.secondary_targets[key] =
								{
									source_tile: [i, j],
									source_key: plant.key,
									tiles: tiles,
									ticks_to_wait: ticks_to_wait,
									key_to_plant: key_to_plant,
									mutation_tiles: mutation_tiles
								};
							}
						}
					}
				}
			}
			
			return found_target;
		},
		
		
		
		//Removes all plants that have been unlocked, aren't currently being used as parents, and aren't part of a parlay. If jqb_section is 1, only the top 5x5 is considered, and if it's 2, only the 11 other spaces are.
		remove_unlocked_plants: function(ignore_parents = false, jqb_section = 0)
		{
			for (let i = 0; i < 6; i++)
			{
				for (let j = 0; j < 6; j++)
				{
					if ((jqb_section === 1 && (i === 5 || j === 5)) || (jqb_section === 2 && !(i === 5 || j === 5)))
					{
						continue;
					}
					
					
					
					let tile = Game.ObjectsById[2].minigame.plot[i][j];
					
					if (tile[0] === 0)
					{
						continue;
					}
					
					let plant = Game.ObjectsById[2].minigame.plantsById[tile[0] - 1];
					
					
					
					let is_secondary_unlock = false;
					
					for (let key in this.secondary_targets)
					{
						if (plant.key === this.secondary_targets[key].key_to_plant)
						{
							for (let k = 0; k < this.secondary_targets[key].tiles.length; k++)
							{
								if (this.secondary_targets[key].tiles[k][0] === i && this.secondary_targets[key].tiles[k][1] === j)
								{
									is_secondary_unlock = true;
									
									break;
								}
							}
							
							if (is_secondary_unlock)
							{
								break;
							}
						}
					}
					
					
					
					if (Game.ObjectsById[2].minigame.plants[plant.key].unlocked && (ignore_parents || this.seed_to_unlock === "" || this.mutation_setups[this.seed_to_unlock].parents.indexOf(plant.key) === -1) && !is_secondary_unlock)
					{
						this.harvest_plant(j, i);
					}
				}
			}
		},
		
		
		
		remove_non_unlocked_duplicates: function()
		{
			let non_unlocked_plants = {};
			
			for (let i = 0; i < 6; i++)
			{
				for (let j = 0; j < 6; j++)
				{
					let tile = Game.ObjectsById[2].minigame.plot[i][j];
					
					if (tile[0] === 0)
					{
						continue;
					}
					
					let plant = Game.ObjectsById[2].minigame.plantsById[tile[0] - 1];
					
					if (!Game.ObjectsById[2].minigame.plants[plant.key].unlocked)
					{
						if (typeof non_unlocked_plants[plant.key] === "undefined")
						{
							non_unlocked_plants[plant.key] = [];
						}
						
						non_unlocked_plants[plant.key].push([i, j]);
					}
				}
			}
			
			for (let key in non_unlocked_plants)
			{
				if (non_unlocked_plants[key].length > 1)
				{
					let max_age = 0;
					
					for (let i = 0; i < non_unlocked_plants[key].length; i++)
					{
						let row = non_unlocked_plants[key][i][0];
						let col = non_unlocked_plants[key][i][1];
						
						let tile = Game.ObjectsById[2].minigame.plot[row][col];
						
						max_age = Math.max(max_age, tile[1]);
					}
					
					for (let i = 0; i < non_unlocked_plants[key].length; i++)
					{
						let row = non_unlocked_plants[key][i][0];
						let col = non_unlocked_plants[key][i][1];
						
						let tile = Game.ObjectsById[2].minigame.plot[row][col];
						
						if (tile[1] < max_age)
						{
							this.harvest_plant(col, row);
						}
					}
				}
			}
		},
		
		
		
		fertilizer_requests: 0,
		
		unlock_type_0_logic: function(parent, tiles_override = 0, empty_tiles_override = 0)
		{
			let id = this.mutation_setups[parent].id;
            let plant = Game.ObjectsById[2].minigame.plantsById[id];
			
			let intact = 0;
            let possibly_intact = 0;
			
			let tiles = [];
			let empty_tiles = [];
			
			if (empty_tiles_override !== 0)
			{
				tiles = tiles_override;
				empty_tiles = empty_tiles_override;
			}
			
			else if (typeof this.mutation_setups[this.seed_to_unlock].tiles !== "undefined")
			{
				tiles = this.mutation_setups[this.seed_to_unlock].tiles;
				
				empty_tiles = this.mutation_setups[this.seed_to_unlock].empty_tiles;
			}
			
			else
			{
				tiles = [[0, 1], [1, 1], [2, 1], [4, 1], [5, 1], [0, 4], [1, 4], [3, 4], [4, 4], [5, 4]];
				
				empty_tiles = [[0, 0], [0, 2], [0, 3], [0, 5], [1, 0], [1, 2], [1, 3], [1, 5], [2, 0], [2, 2], [2, 3], [2, 4], [2, 5], [3, 0], [3, 1], [3, 2], [3, 3], [3, 5], [4, 0], [4, 2], [4, 3], [4, 5], [5, 0], [5, 2], [5, 3], [5, 5]];
			}
			
			//If more than half the plants are missing, we scrap and replant.
			for (let i = 0; i < tiles.length; i++)
			{
				if (Game.ObjectsById[2].minigame.plot[tiles[i][0]][tiles[i][1]][0] - 1 === id)
				{
					intact++;
				}
                
                else if (Game.ObjectsById[2].minigame.plot[tiles[i][0]][tiles[i][1]][0] === 0)
				{
					if (typeof plant.contam !== "undefined" && plant.contam !== 0)
                    {
                        if (this.is_valid_for_dangerous_plant(tiles[i][1], tiles[i][0]))
                        {
                            possibly_intact++;
                        }
                    }
                    
                    else
                    {
                        possibly_intact++;
                    }
				}
			}
			
			if ((this.seed_to_unlock !== "queenbeetLump" && intact < possibly_intact) || (this.seed_to_unlock === "queenbeetLump" && possibly_intact >= 2))
			{
				//Easy -- just plant a bunch.
				let arg = this.seed_to_unlock === "queenbeetLump" ? 1 : 0;
				
				if (empty_tiles_override !== 0)
				{
					arg = 2;
				}
				
				if (arg === 1 && Game.ObjectsById[2].minigame.plants["elderwort"].unlocked)
				{
					arg = 0;
				}
				
				this.remove_unlocked_plants(true, arg);
				
				
				
				//The JQB setup is so time-consuming that we wait to plant them until the area is clear.
				if (this.seed_to_unlock === "queenbeetLump")
				{
					intact = 0;
					
					for (let i = 0; i < tiles.length; i++)
					{
						if (Game.ObjectsById[2].minigame.plot[tiles[i][0]][tiles[i][1]][0] !== 0)
						{
							intact++;
						}
					}
					
					if (intact !== 0)
					{
						return;
					}
					
					//If we've got elderwort, it's time to switch to a 6x6.
					if (Game.ObjectsById[2].minigame.plants["elderwort"].unlocked)
					{
						if (this.mutation_setups.queenbeetLump.empty_tiles[3][0] === 3)
						{
							//We also scrap *everything* so we don't get stuck targeting old plants.
							for (let i = 0; i < 6; i++)
							{
								for (let j = 0; j < 6; j++)
								{
									Game.ObjectsById[2].minigame.harvest(j, i, true);
								}
							}
						}
						
						this.mutation_setups.queenbeetLump = 
						{
							id: 21,
							type: 0,
							parents: ["queenbeet"],
							
							tiles: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 0], [1, 2], [1, 3], [1, 5], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [4, 0], [4, 2], [4, 3], [4, 5], [5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5]],
						
							empty_tiles: [[1, 1], [1, 4], [4, 1], [4, 4]]
						};
					}
				}
				
				
				
				for (let i = 0; i < tiles.length; i++)
				{
					if (Game.ObjectsById[2].minigame.plot[tiles[i][0]][tiles[i][1]][0] === 0)
					{
						this.plant_seed(id, tiles[i][1], tiles[i][0]);
					}
				}
			}
			
			
			
			//In the unique case where the slow plant is immortal, we should always try to fill gaps.
			if (Game.ObjectsById[2].minigame.plants[parent].immortal)
			{
				for (let i = 0; i < tiles.length; i++)
				{
					if (Game.ObjectsById[2].minigame.plot[tiles[i][0]][tiles[i][1]][0] === 0)
					{
						this.plant_seed(id, tiles[i][1], tiles[i][0]);
					}
				}
			}
			
			
			
			let mature = 0;
			
			for (let i = 0; i < tiles.length; i++)
			{
				if (Game.ObjectsById[2].minigame.plot[tiles[i][0]][tiles[i][1]][0] !== 0 && Game.ObjectsById[2].minigame.plot[tiles[i][0]][tiles[i][1]][1] >= plant.mature)
				{
					mature++;
				}
			}
			
			if (mature >= tiles.length / 3)
			{
				this.change_soil(4);
			}
			
			else
			{
				if (empty_tiles_override === 0 && (this.seed_to_unlock !== "queenbeetLump" || this.seed_to_unlock === "queenbeetLump" && Game.ObjectsById[2].minigame.plants["elderwort"].unlocked))
				{
					this.change_soil(1);
				}
				
				else
				{
					this.fertilizer_requests++;
				}
			}
			
			
			
			//If we've reached this point, we know that the targeted plant is not here yet. Therefore, any unlocked plants not in the setup should be cleared.
			for (let i = 0; i < empty_tiles.length; i++)
			{
				let id = Game.ObjectsById[2].minigame.plot[empty_tiles[i][0]][empty_tiles[i][1]][0] - 1;
				
				if (id === -1)
				{
					continue;
				}
				
				let plant = Game.ObjectsById[2].minigame.plantsById[id];
				
				
				
				let is_secondary_unlock = false;
				
				for (let key in this.secondary_targets)
				{
					if (plant.key === this.secondary_targets[key].key_to_plant)
					{
						for (let k = 0; k < this.secondary_targets[key].tiles.length; k++)
						{
							if (this.secondary_targets[key].tiles[k][0] === empty_tiles[i][0] && this.secondary_targets[key].tiles[k][1] === empty_tiles[i][1])
							{
								is_secondary_unlock = true;
								
								break;
							}
						}
						
						if (is_secondary_unlock)
						{
							break;
						}
					}
				}
				
				
				
				if (Game.ObjectsById[2].minigame.plants[plant.key].unlocked && !is_secondary_unlock)
				{
					this.harvest_plant(empty_tiles[i][1], empty_tiles[i][0]);
				}
			}
		},
		
		
		
		ticks_until_fast_plants: -1,
		
		unlock_type_1_logic: function(fast_parent, slow_parent, fast_tiles_override = 0, slow_tiles_override = 0, empty_tiles_override = 0)
		{
			let fast_id = this.mutation_setups[fast_parent].id;
			let slow_id = this.mutation_setups[slow_parent].id;
			
			let fast_plant = Game.ObjectsById[2].minigame.plantsById[fast_id];
			let slow_plant = Game.ObjectsById[2].minigame.plantsById[slow_id];
			
			let fast_tiles = [];
			let slow_tiles = [];
			
			let empty_tiles = [];
			
			
			
			if (empty_tiles_override !== 0)
			{
				fast_tiles = fast_tiles_override;
				slow_tiles = slow_tiles_override;
				empty_tiles = empty_tiles_override;
			}
			
			else if (typeof this.mutation_setups[this.seed_to_unlock].empty_tiles !== "undefined")
			{
				fast_tiles = this.mutation_setups[this.seed_to_unlock].fast_tiles;
				slow_tiles = this.mutation_setups[this.seed_to_unlock].slow_tiles;
				
				empty_tiles = this.mutation_setups[this.seed_to_unlock].empty_tiles;
			}
			
			else
			{
				fast_tiles = [[0, 1], [2, 1], [5, 1], [1, 4], [4, 4]];
				slow_tiles = [[1, 1], [4, 1], [0, 4], [3, 4], [5, 4]];
				
				empty_tiles = [[0, 0], [0, 2], [0, 3], [0, 5], [1, 0], [1, 2], [1, 3], [1, 5], [2, 0], [2, 2], [2, 3], [2, 4], [2, 5], [3, 0], [3, 1], [3, 2], [3, 3], [3, 5], [4, 0], [4, 2], [4, 3], [4, 5], [5, 0], [5, 2], [5, 3], [5, 5]];
			}
			
			
			
			//If more than half the slow plants are missing, we should replant everything.
			let intact = 0;
            let possibly_intact = 0;
			
			for (let i = 0; i < slow_tiles.length; i++)
			{
				if (Game.ObjectsById[2].minigame.plot[slow_tiles[i][0]][slow_tiles[i][1]][0] - 1 === slow_id)
				{
					intact++;
				}
                
                else if (Game.ObjectsById[2].minigame.plot[slow_tiles[i][0]][slow_tiles[i][1]][0] === 0)
                {
                    //Here we have to double check that this is actually a spot that could be planted in.
                    if (typeof slow_plant.contam !== "undefined" && slow_plant.contam !== 0)
                    {
                        if (this.is_valid_for_dangerous_plant(slow_tiles[i][1], slow_tiles[i][0]))
                        {
                            possibly_intact++;
                        }
                    }
                    
                    else
                    {
                        possibly_intact++;
                    }
                }
			}
			
			if (intact < possibly_intact)
			{
				//We start with the slow ones.
				let arg = this.seed_to_unlock === "queenbeetLump" ? 1 : 0;
				
				if (empty_tiles_override !== 0)
				{
					arg = 2;
				}
				
				this.remove_unlocked_plants(true, arg);
				
				for (let i = 0; i < slow_tiles.length; i++)
				{
					if (Game.ObjectsById[2].minigame.plot[slow_tiles[i][0]][slow_tiles[i][1]][0] === 0)
					{
						this.plant_seed(slow_id, slow_tiles[i][1], slow_tiles[i][0]);
					}
				}
				
				this.ticks_until_fast_plants = -1;
			}
			
			//In the unique case where the slow plant is immortal, we should always try to fill gaps.
			if (Game.ObjectsById[2].minigame.plants[slow_parent].immortal)
			{
				for (let i = 0; i < slow_tiles.length; i++)
				{
					if (Game.ObjectsById[2].minigame.plot[slow_tiles[i][0]][slow_tiles[i][1]][0] === 0)
					{
						this.plant_seed(slow_id, slow_tiles[i][1], slow_tiles[i][0]);
					}
				}
			}
			
			
			
			let mature = 0;
			
			for (let i = 0; i < slow_tiles.length; i++)
			{
				if (Game.ObjectsById[2].minigame.plot[slow_tiles[i][0]][slow_tiles[i][1]][0] !== 0 && Game.ObjectsById[2].minigame.plot[slow_tiles[i][0]][slow_tiles[i][1]][1] >= slow_plant.mature)
				{
					mature++;
				}
			}
			
			//At this point, the slow plants are guaranteed to be intact, so we can test if it's the right time to plant the fast ones.
			if (this.ticks_until_fast_plants === -1)
			{
				if (mature === 0)
				{
					let fast_ticks = Game.ObjectsById[2].minigame.plants[fast_plant.key].mature / (Game.ObjectsById[2].minigame.plants[fast_plant.key].ageTick + Game.ObjectsById[2].minigame.plants[fast_plant.key].ageTickR / 2);
					
					let slow_ticks = Game.ObjectsById[2].minigame.plants[slow_plant.key].mature / (Game.ObjectsById[2].minigame.plants[slow_plant.key].ageTick + Game.ObjectsById[2].minigame.plants[slow_plant.key].ageTickR / 2);
					
					this.ticks_until_fast_plants = Math.max(Math.floor(slow_ticks - fast_ticks), 0);
				}
				
				else
				{
					this.ticks_until_fast_plants = 0;
				}
			}
			
			
			
			intact = 0;
			
			for (let i = 0; i < fast_tiles.length; i++)
			{
				if (Game.ObjectsById[2].minigame.plot[fast_tiles[i][0]][fast_tiles[i][1]][0] - 1 === fast_id)
				{
					intact++;
				}
			}
			
			//Testing if this is zero and not just low is important for everdaisies and isn't a big inefficiency.
			if (intact === 0 && this.ticks_until_fast_plants === 0)
			{
				for (let i = 0; i < fast_tiles.length; i++)
				{
					if (Game.ObjectsById[2].minigame.plot[fast_tiles[i][0]][fast_tiles[i][1]][0] === 0)
					{
						this.plant_seed(fast_id, fast_tiles[i][1], fast_tiles[i][0]);
					}
				}
			}
			
			
			
			mature = 0;
			
			for (let i = 0; i < fast_tiles.length; i++)
			{
				if (Game.ObjectsById[2].minigame.plot[fast_tiles[i][0]][fast_tiles[i][1]][0] !== 0 && Game.ObjectsById[2].minigame.plot[fast_tiles[i][0]][fast_tiles[i][1]][1] >= fast_plant.mature)
				{
					mature++;
				}
			}
			
			if (mature >= fast_tiles.length / 3)
			{
				this.change_soil(4);
			}
			
			else
			{
				if (empty_tiles_override === 0 && (this.seed_to_unlock !== "queenbeetLump" || this.seed_to_unlock === "queenbeetLump" && Game.ObjectsById[2].minigame.plants["elderwort"].unlocked))
				{
					this.change_soil(1);
				}
				
				else
				{
					this.fertilizer_requests++;
				}
			}
			
			
			
			//If we've reached this point, we know that the targeted plant is not here yet. Therefore, any unlocked plants not in the setup should be cleared.
			for (let i = 0; i < empty_tiles.length; i++)
			{
				let id = Game.ObjectsById[2].minigame.plot[empty_tiles[i][0]][empty_tiles[i][1]][0] - 1;
				
				if (id === -1)
				{
					continue;
				}
				
				let plant = Game.ObjectsById[2].minigame.plantsById[id];
				
				
				
				let is_secondary_unlock = false;
				
				for (let key in this.secondary_targets)
				{
					if (plant.key === this.secondary_targets[key].key_to_plant)
					{
						for (let k = 0; k < this.secondary_targets[key].tiles.length; k++)
						{
							if (this.secondary_targets[key].tiles[k][0] === empty_tiles[i][0] && this.secondary_targets[key].tiles[k][1] === empty_tiles[i][1])
							{
								is_secondary_unlock = true;
								
								break;
							}
						}
						
						if (is_secondary_unlock)
						{
							break;
						}
					}
				}
				
				
				
				if (Game.ObjectsById[2].minigame.plants[plant.key].unlocked && !is_secondary_unlock)
				{
					this.harvest_plant(empty_tiles[i][1], empty_tiles[i][0]);
				}
			}
		},
		
		
		
		//Apply fertilizer and wait.
		unlock_meddleweed_logic: function()
		{
			this.change_soil(1);
		},
		
		
		
		//Grow a full plot of meddleweed and harvest when very old.
		unlock_crumbspore_brownMold_logic: function()
		{
			this.change_soil(1);
			
			//Remove any non-weed.
			for (let i = 0; i < 6; i++)
			{
				for (let j = 0; j < 6; j++)
				{
					let tile = Game.ObjectsById[2].minigame.plot[i][j];
					
					if (tile[0] === 0)
					{
						//Plant meddleweed.
						this.plant_seed(this.mutation_setups.meddleweed.id, j, i);
						
						continue;
					}
					
					let plant = Game.ObjectsById[2].minigame.plantsById[tile[0] - 1];
					
					if ((plant.key === "meddleweed" && tile[1] > 85) || (plant.key !== "meddleweed" && Game.ObjectsById[2].minigame.plants[plant.key].unlocked))
					{
						this.harvest_plant(j, i);
					}
				}
			}
		},
		
		
		
		change_soil: function(id)
		{
			if (!this.do_soil_rotation)
			{
				return;
			}
            
            if ((id === 1 && Game.ObjectsById[2].amount < 50) || (id === 4 && Game.ObjectsById[2].amount < 300))
            {
                return;
            }
			
			//Shriekbulbs mutate from Duketaters at any age.
			if (this.seed_to_unlock === "shriekbulb" && Game.ObjectsById[2].minigame.soil === 4)
			{
				return;
			}
			
			if (this.need_woodchips_for_secondary_target && Game.ObjectsById[2].minigame.soil === 4)
			{
				return;
			}
			
			if (Game.ObjectsById[2].minigame.soil !== id && Game.ObjectsById[2].minigame.nextSoil <= Date.now())
			{
				Game.ObjectsById[2].minigame.soil = id;
				
				Game.ObjectsById[2].minigame.nextSoil = Date.now() + 600000;
				
				try
				{
					if (id === 1)
					{
						l("gardenSoil-1").classList.add("on");
						l("gardenSoil-4").classList.remove("on");
					}
					
					else
					{
						l("gardenSoil-4").classList.add("on");
						l("gardenSoil-1").classList.remove("on");
					}
				}
				
				catch(ex) {}
			}
		},
        
        
        
        is_valid_for_dangerous_plant: function(x, y)
        {
            let tiles = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
            
            for (let i = 0; i < 4; i++)
            {
                let row = tiles[i][0];
                let col = tiles[i][1];
                
                if (row < 0 || row > 5 || col < 0 || col > 5)
                {
                    continue;
                }
                
                let adj_id = Game.ObjectsById[2].minigame.plot[col][row][0] - 1;
                
                if (adj_id === -1)
                {
                    continue;
                }
                
                let adj_plant = Game.ObjectsById[2].minigame.plantsById[adj_id];
                
                //It's okay to plant dangerous plants next to other dangerous ones.
                if (typeof adj_plant.contam !== "undefined" && adj_plant.contam !== 0)
                {
                    continue;
                }
                
                //But it's not okay to plant to susceptible ones.
                if (typeof adj_plant.noContam === "undefined" || !adj_plant.noContam)
                {
                    return false;
                }
            }
            
            return true;
        },
		
		
		
		plant_seed: function(id, x, y)
		{
			if (this.avoid_cps_buffs)
			{
				for (let key in Game.buffs)
				{
					if (typeof Game.buffs[key].multCpS !== "undefined" && Game.buffs[key].multCpS > 1 && Game.buffs[key].name.toLowerCase().slice(0, 4) !== "loan" && (!this.allow_frenzies || Game.buffs[key].name !== "Frenzy"))
					{
						Game.Notify('Auto Sacrifice', `Skipping planting due to active buff`, [6, 29], 5);
						
						return;
					}
				}
			}
			
			if (Game.ObjectsById[2].minigame.plot[y][x][0] !== 0)
			{
				return;
			}
            
            
            
			let key = Game.ObjectsById[2].minigame.plantsById[id].key;
            
            //Don't plant contaminating plants near susceptible ones.
            let plant = Game.ObjectsById[2].minigame.plants[key];
            
            if (typeof plant.contam !== "undefined" && plant.contam !== 0)
            {
                if (!this.is_valid_for_dangerous_plant(x, y))
                {
                    return;
                }
            }
			
			if (plant.unlocked)
			{
				Game.ObjectsById[2].minigame.useTool(id, x, y);
			}
		},
		
		
		
		harvest_plant: function(j, i)
		{
			let plant_id = Game.ObjectsById[2].minigame.plot[i][j][0] - 1;
			
			if (plant_id === this.mutation_setups["elderwort"].id && Game.ObjectsById[2].minigame.plants["elderwort"].unlocked)
			{
				//Elderwort next to a JQB is never removed.
				let found_target = false;
				
				for (let k = -1; k <= 1; k++)
				{
					for (let l = -1; l <= 1; l++)
					{
						if ((k === 0 && l === 0) || i + k < 0 || i + k > 5 || j + l < 0 || j + l > 5)
						{
							continue;
						}
						
						let id = Game.ObjectsById[2].minigame.plot[i + k][j + l][0] - 1;
						
						if (id === -1)
						{
							continue;
						}
						
						if (id === this.mutation_setups["queenbeetLump"].id)
						{
							found_target = true;
							
							break;
						}
					}
					
					if (found_target)
					{
						break;
					}
				}
				
				if (found_target)
				{
					return;
				}
			}
			
			Game.ObjectsById[2].minigame.harvest(j, i, true);
		}
	});
	}();