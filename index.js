const Command = require('command'),
		path = require('path'),
		fs = require('fs')
		
module.exports = function NameChanger(dispatch) {
	const command = Command(dispatch)
	
	let newName = null,
		newNames = null,
		newTitle = null,
		enabled = true,
		originalName = null;
		originalTitle = null;
		otherCharacter = [];
		character = [];
		cid = null;
		pId = null;
	
	try {
		character = require('./name.json')
	}
	catch(e) {}
	
	try {
		otherCharacter = require('./names.json')
	}
	catch(e) {}


	command.add('name', str => {
		if(!str){
			command.message('Name: '+str+' is invalid.');
		}
		else if(str){
			command.message('Name: '+str);
			AddAlias(str);
		}
	});
	
	command.add('names', (str, str2) => {
		if(!str){
			command.message('Name: '+str+' is invalid.');
		}
		else if(str && str2){
			command.message('Alias of '+str+' is now '+str2);
			AddAliases(str,str2);
		}
	});
	
	command.add('title', str => {
		if(!str){
			command.message('Title: '+str+' is invalid.');
		}
		else if(str == 'off'){
			ChangeTitle(originalTitle);
		}
		else if(str){
			command.message('TitleID: '+str);
			ChangeTitle(parseInt(str));
		}
	});
	
	command.add('togglename', () => {
		if(!enabled){
			command.message('NameChanger enabled');
			enabled = true;
		}
		else if(enabled){
			command.message('NameChanger disabled');
			enabled = false;
		}
	});
	
	dispatch.hook('S_LOGIN', 2, event => {
		AddCharacter(event.playerId.toString(), event.name);
		pId = event.playerId.toString();
		originalTitle = event.title;
		originalName = event.name;
		cid = event.cid;
		if(enabled && newTitle && newName){
			event.title = newTitle;
			originalName = event.name;
			event.name = newName;
			return true;
		}
		else if(enabled && newTitle){
			event.title = newTitle;
			return true;
		}
		else if(enabled && newName) {
			event.name = newName;
			return true;
		}
		return
	});
	
	dispatch.hook('S_SPAWN_USER', 3, event => {
		AddCharacters(event.name);
			if(enabled && newNames){
				event.name = newNames;
				newNames = '';
				return true;
			}
		return
	});
	
	dispatch.hook('S_PARTY_MEMBER_LIST', 5, event => {
		for(let i in event.members){
			AddCharacters(event.members[i].name);
				if(enabled && newNames){
					event.members[i].name = newNames;
					newNames = '';
					return true;
				}
		}
		return
	});
	
	dispatch.hook('S_CHAT', 1, event => {
		if(enabled && newName) {
			if(event.authorName == originalName) {
				event.authorName = newName;
				return true;
			}
		}
		return
	});
	
	dispatch.hook('S_WHISPER', 1, event => {
		if(enabled && newName) {
			if(event.author == originalName) {
				event.author = newName;
				return true;
			}
		}
	});
	
	dispatch.hook('C_SHOW_ITEM_TOOLTIP_EX', 1, event => {
		if(enabled && newName) {
			event.name = originalName;
			return true;
		}
		return
	});
	
	
	dispatch.hook('S_GUILD_MEMBER_LIST', 1, event => {
		for (let j in event.members){
			if(enabled && newName && event.members[j].playerID == pId) {
				event.members[j].name = newName;
				return true;
			}
		}
	});
	
	dispatch.hook('S_APPLY_TITLE', 1, event => {
		if(event.cid == cid){
			ChangeTitle(event.title);
		}
	});	
	
	function AddCharacter(playerId, name){
	let match = false;
		for(let i in character){
			if(character[i].playerId == playerId){
				newName = character[i].alias;
				newTitle = character[i].title;
				match = true;
			}
		}
		if(!match){
			character.push({
				playerId : playerId,
				name : name,
				alias : '',
				title : ''
				});
				newName = '';
			saveName();
		}
	}
	
	function AddCharacters(name){
	let match = false;
		for(let i in otherCharacter){
			if(otherCharacter[i].name == name){
				newNames = otherCharacter[i].alias;
				match = true;
			}
		}
		if(!match){
			otherCharacter.push({
				name : name,
				alias : '',
				});
			saveNames();
		}
	}
	
	function AddAlias(alias){
		for(let l in character){
			if(character[l].playerId == pId){
				character[l].alias = alias;
				newName = character[l].alias;
			}
		}
		saveName();
	}
	
	function AddAliases(name,alias){
		for(let l in otherCharacter){
			if(otherCharacter[l].name == name){
				otherCharacter[l].alias = alias;
				newNames = otherCharacter[l].alias;
			}
		}
		saveNames();
	}
	
	function ChangeTitle(titleID){
		for(let l in character){
			if(character[l].playerId == pId){
				character[l].title = titleID;
				newTitle = character[l].title;
			}
		}
		dispatch.toClient('S_APPLY_TITLE', 1, {
					cid : cid,
					title : newTitle,
					unk2 : 1,
					unk3 : 0
		});
		saveName();
	}
	
	function saveName() {
		fs.writeFileSync(path.join(__dirname, 'name.json'), JSON.stringify(character))
	}
	function saveNames() {
		fs.writeFileSync(path.join(__dirname, 'names.json'), JSON.stringify(otherCharacter))
	}
}
