Game.registerMod("MaxButtonRestorer",
{
	init:function()
	{
		Game.Notify(`Max button restored!`,'',[16,5]);

		Object.values(Game.Objects).forEach((obj) =>
		{
			obj.originalGetSumPrice = obj.getSumPrice;
			obj.getSumPrice = function(amount)
			{
				if(amount === -1)
				{
					let price = 0;
					let currentAmount = Math.max(0,this.amount);
					for(let i=0;;i++)
					{
						let next = this.basePrice*Math.pow(Game.priceIncrease,Math.max(0,(i+currentAmount)-this.free));
						if(price+next>Game.cookies && i>0)
						{
							break;
						}
						price += next;
					}
					price=Game.modifyBuildingPrice(this,price);
					return Math.ceil(price);;
				}
				else
				{
					return this.originalGetSumPrice(amount);
				}
			};

			obj.getSumBuyable = function(amount)
			{
				//Return amount if not max
				if(amount !== -1){return amount;}
				
				let price = 0;
				let currentAmount = Math.max(0,this.amount);
				for(let i=0;;i++)
				{
					price += this.basePrice*Math.pow(Game.priceIncrease,Math.max(0,(i+currentAmount)-this.free));
					if(price>Game.cookies && i>0)
					{
						return i;
					}
				}
			};

			obj.originalRefresh = obj.refresh;
			obj.refresh = function()
			{
				this.price=this.getPrice();
				if (Game.buyMode === 1)
				{
					//New member
					this.bulkBuyable = this.getSumBuyable(Game.buyBulk);
				}
				this.originalRefresh();
			};

			obj.originalRebuild = obj.rebuild;
			obj.rebuild = function()
			{
				this.originalRebuild();
				if(Game.buyMode === 1 && Game.buyBulk === -1)
				{
					l('productPriceMult'+this.id).textContent=('x'+this.bulkBuyable+' ');
				}
			};

			obj.originalBuy = obj.buy;
			obj.buy = function(amount)
			{
				if (!amount) amount=Game.buyBulk;
				//If we are buying and we don't have enough cookeis to buy the bulk, stop
				if(Game.buyMode === 1 && Game.cookies<this.getSumPrice(amount))
				{
					return 0;
				}
				this.originalBuy(amount);
			};
		});

		Game.storeBulkButton = function(id)
		{
			switch(id)
			{
				case 0:Game.buyMode=1;break;
				case 1:Game.buyMode=-1;break;
				case 2:Game.buyBulk=1;break;
				case 3:Game.buyBulk=10;break;
				case 4:Game.buyBulk=100;break;
				case 5:Game.buyBulk=-1;break;
			}

			let storeBulkBuy = l('storeBulkBuy');
			let storeBulkSell = l('storeBulkSell');
			storeBulkBuy.className='storePreButton storeBulkMode';
			storeBulkSell.className='storePreButton storeBulkMode';
			switch(Game.buyMode)
			{
				case 1:storeBulkBuy.className+=' selected';break;
				case -1:storeBulkSell.className+=' selected';break;
			}

			let storeBulk1 = l('storeBulk1');
			let storeBulk10 = l('storeBulk10');
			let storeBulk100 = l('storeBulk100');
			let storeBulkMax = l('storeBulkMax');
			storeBulk1.className='storePreButton storeBulkAmount';
			storeBulk10.className='storePreButton storeBulkAmount';
			storeBulk100.className='storePreButton storeBulkAmount';
			storeBulkMax.className='storePreButton storeBulkAmount';
			switch(Game.buyBulk)
			{
				case 1:storeBulk1.className+=' selected';break;
				case 10:storeBulk10.className+=' selected';break;
				case 100:storeBulk100.className+=' selected';break;
				case -1:storeBulkMax.className+=' selected';break;
			}
			
			switch(Game.buyMode)
			{
				case 1:
				{
					l('products').className='storeSection';
					storeBulkMax.textContent=loc("max");
					break;
				}
				case -1:
				{
					l('products').className='storeSection selling';
					storeBulkMax.textContent=loc("all");
						break;
				}
			}
			
			Game.storeToRefresh=1;
			if (id!==-1) PlaySound('snd/tick.mp3');
		};

		l('storeBulkMax').style.visibility='visible';

		Game.registerHook('draw',function()
		{
			//Stop if current ascending
			if(Game.OnAscend){return;}
			
			//Only run every 5th frame
			if(Game.drawT%5 !== 0){return};

			//Stop if buy max is not selected
			if(Game.buyMode!==1 || Game.buyBulk!==-1){return;}

			for(let i in Game.Objects)
			{
				let me=Game.Objects[i];
				
				let oldBulkBuyable = me.bulkBuyable;
				me.bulkBuyable = me.getSumBuyable(Game.buyBulk);

				//Nothing has changed
				if(oldBulkBuyable === me.bulkBuyable){continue;}
				
				me.bulkPrice = me.getSumPrice(Game.buyBulk);

				l('productPrice'+me.id).textContent=Beautify(Math.round(me.bulkPrice));
				l('productPriceMult'+me.id).textContent=('x'+me.bulkBuyable+' ');

				if(me.locked){continue;}

				//make products full-opacity if we can buy them
				let classes='product unlocked';
				if (Game.cookies>=me.bulkPrice)
				{
					classes+=' enabled';
				}
				else
				{
					classes+=' disabled';
				}
				me.l.className=classes;
				//if (me.id>0) {l('productName'+me.id).innerHTML=Beautify(me.storedTotalCps/Game.ObjectsById[me.id-1].storedTotalCps,2);}
			}
		});
	}
});