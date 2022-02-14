var table = null, hitter = null;
var hide = () => {};

var elem = null;

exports.load = function(){
	let graphics = Core.graphics;
	
	table = extend(Table, Tex.buttonOver, {
        getPrefHeight(){
            return Math.min(this.super$getPrefHeight(), graphics.getHeight());
        },

        getPrefWidth(){
            return Math.min(this.super$getPrefWidth(), graphics.getWidth());
        },
    });
    table.margin(4);

    hide = () => {
    	Core.app.post(() => hitter.remove());
        table.actions(Actions.fadeOut(0.3, Interp.fade), Actions.remove());
    };
    
    hitter = new Element();
    
    hitter.fillParent = true;
}

function rebuild(hideFunc){
	let graphics = Core.graphics;
    let scene = Core.scene;
    
    scene.add(hitter);
    scene.add(table);
    
    table.clear();
	hitter.tapped(hide);
	
	table.update(() => {
        if(elem.parent == null || !elem.isDescendantOf(scene.root)){
            Core.app.post(() => {
            	hitter.remove();
                table.remove();
            });
            return;
        }

        elem.localToStageCoordinates(Tmp.v1.set(elem.getWidth() / 2, 0));
        table.setPosition(Tmp.v1.x, Tmp.v1.y, Align.top);
        if(table.getWidth() > scene.getWidth()) table.setWidth(Core.graphics.getWidth());
        table.keepInStage();
        table.invalidateHierarchy();
        table.pack();
    });
    
    table.actions(Actions.alpha(0), Actions.fadeIn(0.3, Interp.fade));

	elem.localToStageCoordinates(Tmp.v1.set(0, 0));
    table.top().pane(new ScrollPane.ScrollPaneStyle, inner => {
        inner.top();
        hideFunc(inner, hide);
    }).maxHeight(Math.min(Tmp.v1.y - elem.getHeight(), 350)).pad(0).top().scrollX(false);
}

exports.shown = function(){
	return table.hasParent();
}

exports.showFor = function(element, hideFunc){
	if(element == null) throw new IllegalArgumentException("element cannot be null.");
	elem = element;
	rebuild(hideFunc);
}