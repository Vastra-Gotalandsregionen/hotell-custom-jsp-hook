<%@ include file="/html/portlet/journal/init.jsp" %>

<aui:script use="aui-base">

    var journalArticleContainer = A.one('.journal-article-container');
    var ddmContainer = journalArticleContainer.one('.lfr-ddm-container');

    var fieldWrappers = journalArticleContainer.all('.field-wrapper');

    fieldWrappers.each(function(item, index, list) {
        insertToggleButtons(item);
    });

    ddmContainer.on('ddmContainer:fieldInserted', function(e) {
        var insertedNode = A.one('#' + e.nodeId);
        var insertedNodeParent = insertedNode.ancestor();

        var insertedNodeFieldWrappers = insertedNodeParent.all('.field-wrapper');

        insertedNodeFieldWrappers.each(function(item, index, list) {
            insertToggleButtons(item);
        });
    });

    journalArticleContainer.delegate('click', function(e) {

        var currentTarget = e.currentTarget;

        var isCollapse = currentTarget.hasClass('custom-panel-collapse-button');
        var isExpand = currentTarget.hasClass('custom-panel-expand-button');

        var fieldWrapper = currentTarget.ancestor('.field-wrapper');
        if(isCollapse) {

            fieldWrapper.addClass('collapsed');

            var expandButton = currentTarget.siblings('.custom-panel-expand-button');

            currentTarget.hide();
            expandButton.show();

        } else if(isExpand) {

            fieldWrapper.removeClass('collapsed');

            var collapseButton = currentTarget.siblings('.custom-panel-collapse-button');

            currentTarget.hide();
            collapseButton.show();
        }


    }, '.custom-panel-toggle-button');

    function insertToggleButtons(item) {
        var cssClassesBase = 'custom-panel-toggle-button';

        var directChildAdd = item.all('> .lfr-ddm-repeatable-add-button');
        var directChildDelete = item.all('> .lfr-ddm-repeatable-delete-button');

        var hasAddBtn = directChildAdd.size() > 0;
        var hasDeleteBtn = directChildDelete.size() > 0;


        if(hasAddBtn && hasDeleteBtn) {
            cssClassesBase = cssClassesBase + ' custom-panel-toggle-button-pushed-x2';
        } else if(hasAddBtn) {
            cssClassesBase = cssClassesBase + ' custom-panel-toggle-button-pushed';
        }

        var cssClassesCollapse = cssClassesBase + ' custom-panel-collapse-button icon-chevron-sign-down';
        var cssClassesExpand = cssClassesBase + ' custom-panel-expand-button icon-chevron-sign-right hide';

        var collapseHtml = '<a href="javascript:;" class="' + cssClassesCollapse + '"></a>'
        var expandHtml = '<a href="javascript:;" class="' + cssClassesExpand + '"></a>'

        item.append(collapseHtml);
        item.append(expandHtml);
    }

</aui:script>

<liferay-util:html-top>
    <style class="text/css">

        .field-wrapper .custom-panel-toggle-button {
            display: block;
            height: 16px;
            position: absolute;
            right: 4px;
            top: 4px;
            width: 16px;
        }

        .field-wrapper .custom-panel-toggle-button-pushed {
            right: 24px;
        }

        .field-wrapper .custom-panel-toggle-button-pushed-x2 {
            right: 44px;
        }

        .field-wrapper .custom-panel-toggle-button:hover {
            text-decoration: none;
        }

        .aui .lfr-ddm-container .control-group.collapsed > *,
        .aui .lfr-ddm-container .control-group.collapsed > .control-group.field-wrapper,
        .aui .lfr-ddm-container .control-group.collapsed > .control-group > *
        {
            display: none;
        }

        .aui .lfr-ddm-container .control-group.collapsed > .control-label,
        .aui .lfr-ddm-container .control-group.collapsed > a,
        .aui .lfr-ddm-container .control-group.collapsed > .control-group,
        .aui .lfr-ddm-container .control-group.collapsed > .control-group > .control-label
        {
            display: block;
        }


    </style>
</liferay-util:html-top>