const myTable = require("ui/myTable");

Events.on(EventType.ClientLoadEvent, cons(e => {
	myTable.load();
	
	let ui = Vars.ui;
	let content = Vars.content;
	let graphics = Core.graphics;
	let scene = Core.scene;
	let settings = Core.settings;
	let input = Core.input;
	let app = Core.app;
	
	const types = Seq.with("constant", "number", "null", "string", "content", "building", "unit", "enum", "unknown");
	const varsMap = types.sort().asMap(item => item, item => new Seq());
	let clearMap = () => {
		varsMap.each((key, value) => value.clear());
	}
	
	let dialog = ui.logic;
	let target = null;
	
	let showFor = (elem) => {
		let executor = Reflect.get(dialog, "executor");
		
		// executor maybe null
		if(executor == null) return;
		
		let text = elem.getText();
		
		clearMap();
		executor.vars.forEach((s) => {
			if(s.constant && s.name.startsWith("_")) return;
			varsMap.get(typeName(s)).add(s);
		});
		
		myTable.showFor(elem, (t, hide) => {
			varsMap.each((type, vars) => {
				if(vars.isEmpty()) return;
				if(text.length > 0) vars.sort(Floatf(item => Strings.levenshtein(text, item.name)));
				else vars.sortComparing(func(item => item.name));
				
				t.table(cons(typeT => {
					typeT.table(cons(name => {
						name.add(type + ":").left();
					})).left().growX().row();
					
					typeT.table(Tex.buttonDown, varsT => {
						let i = 0;
						vars.each(s => {
							let button = varsT.button(cons(b => {
        						let color = typeColor(s);
        						let label = new Label(" " + s.name + " ", Styles.outlineLabel);
        						label.setColor(Pal.accent);
        						b.stack(new Image(Tex.whiteui, color), label).pad(2).growX();
    						}), () => {
    							if(target){
    								target.setProgrammaticChangeEvents(true);
        							target.setText(s.name);
        						}
        						hide();
        					}).height(35).growX().get();
        					let style = button.getStyle();
        					style.over = style.down = style.up = Styles.none;
        					
        					if(++i % 2 == 0) varsT.row();
						});
					}).left().growX();
				})).left().pad(3).fillX().row();
			});
		});
	}
	
	let canvas = dialog.canvas;
	let buttons = dialog.buttons;
	
	// override "edit" button
	let cell = getCell(buttons.find("edit"));
	let editDialog = new BaseDialog("@editor.export");
        editDialog.cont.pane(p => {
        p.margin(10);
        p.table(Tex.button, t => {
            let style = Styles.cleart;
            t.defaults().size(280, 60).left();

            t.button("@schematic.copy", Icon.copy, style, () => {
                editDialog.hide();
                app.setClipboardText(canvas.save());
            }).marginLeft(12);
            t.row();
            t.button("@schematic.copy.import", Icon.download, style, () => {
                editDialog.hide();
                try{
                    canvas.load(app.getClipboardText().replace("\r\n", "\n"));
		}catch(e){
                    ui.showErrorMessage("" + e);
                }
            }).marginLeft(12).disabled(b => app.getClipboardText() == null);
            t.row();
            t.button("@schematic.copy.add", Icon.download, style, () => {
            	editDialog.hide();
            	try{
                        let asm = app.getClipboardText().replace("\r\n", "\n");
                        let statements = LAssembler.read(asm);
            		let size = canvas.statements.getChildren().size;
            		statements.each(st => {
            			if(st instanceof LStatements.JumpStatement) st.destIndex += size;
            			canvas.add(st);
            			st.setupUI();
            		});
            	}catch(e){
            		ui.showErrorMessage("" + e);
            	}
            }).marginLeft(12).disabled(b => app.getClipboardText() == null);
        });
    });
	editDialog.addCloseButton();
	
	let myEditButton = new Table().button("@edit", Icon.edit, () => editDialog.show()).get();
	cell.setElement(myEditButton).name("edit");
	
	// a button for mobile
	if(Vars.mobile){
		buttons.button("@schematic.KeyboardMode", Styles.clearToggleMenut, () => {
			input.setUseKeyboard(!input.useKeyboard());
		}).checked(b => input.useKeyboard());
	}
    	
	dialog.update(() => {
        if(scene.hasField() && !myTable.shown()){
        	target = scene.getKeyboardFocus();
        	Core.app.post(() => showFor(target));
        }
    });
}));

function typeColor(s){
    let objval = s.objval;
    return s.constant ? Pal.health :
    !s.isobj ? Pal.place :
    objval == null ? Color.darkGray :
    objval instanceof String ? Pal.ammo :
    objval instanceof Content ? Pal.logicOperations :
    objval instanceof Building ? Pal.logicBlocks :
    objval instanceof Unit ? Pal.logicUnits :
    objval instanceof java.lang.Enum ? Pal.logicIo :
    Color.white;
}

function typeName(s){
    let objval = s.objval;
    return s.constant ? "constant" :
    !s.isobj ? "number" :
    objval == null ? "null" :
    objval instanceof String ? "string" :
    objval instanceof Content ? "content" :
    objval instanceof Building ? "building" :
    objval instanceof Unit ? "unit" :
    objval instanceof java.lang.Enum ? "enum" :
    "unknown";
}

function getCell(elem){
	let parent = elem.parent;
	if(parent != null && parent instanceof Table){
		return parent.getCell(elem);
	}
	return null;
}
