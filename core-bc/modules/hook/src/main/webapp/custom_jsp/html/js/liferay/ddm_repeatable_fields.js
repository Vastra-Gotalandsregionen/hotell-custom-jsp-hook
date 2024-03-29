/*
 * Copyright 2010 Västra Götalandsregionen
 *
 *   This library is free software; you can redistribute it and/or modify
 *   it under the terms of version 2.1 of the GNU Lesser General Public
 *   License as published by the Free Software Foundation.
 *
 *   This library is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public
 *   License along with this library; if not, write to the
 *   Free Software Foundation, Inc., 59 Temple Place, Suite 330,
 *   Boston, MA 02111-1307  USA
 */

AUI.add(
	'liferay-ddm-repeatable-fields',
	function(A) {
		var Lang = A.Lang;

		var SELECTOR_REPEAT_BUTTONS = '.lfr-ddm-repeatable-add-button, .lfr-ddm-repeatable-delete-button';

		var TPL_ADD_REPEATABLE = '<a class="lfr-ddm-repeatable-add-button icon-plus-sign" href="javascript:;"></a>';

		var TPL_DELETE_REPEATABLE = '<a class="lfr-ddm-repeatable-delete-button icon-minus-sign" href="javascript:;"></a>';

		var RepeatableFields = A.Component.create(
			{
				ATTRS: {
					classNameId: {
					},

					classPK: {
					},

					container: {
						setter: A.one
					},

					doAsGroupId: {
					},

					fieldsDisplayInput: {
						setter: A.one
					},

					namespace: {
					},

					p_l_id: {
					},

					portletNamespace: {
					},

					repeatable: {
						validator: Lang.isBoolean,
						value: false
					}
				},

				EXTENDS: A.Base,

				NAME: 'liferay-ddm-repeatable-fields',

				eventHandlers: {},

				prototype: {
					initializer: function() {
						var instance = this;

						instance.bindUI();
						instance.syncUI();
					},

					bindUI: function() {
						var instance = this;

						var container = instance.get('container');

						container.delegate('click', instance._onClickRepeatableButton, SELECTOR_REPEAT_BUTTONS, instance);

						var hoverHandler = instance._onHoverRepeatableButton;

						container.delegate('hover', hoverHandler, hoverHandler, SELECTOR_REPEAT_BUTTONS, instance);

						Liferay.after('form:registered', instance._afterFormRegistered, instance);

						instance.on(
							['repeat', 'remove'],
							function(event) {
								var fieldInputName = instance.getFieldInputName(event.fieldNode);

								var liferayForm = instance.liferayForm;

								if (liferayForm) {
									var validatorRules = liferayForm.formValidator.get('rules');

									if (event.type === 'liferay-ddm-repeatable-fields:repeat') {
										var originalFieldRules = validatorRules[instance.getFieldInputName(event.originalFieldNode)];

										if (originalFieldRules) {
											validatorRules[fieldInputName] = originalFieldRules;
										}
									}
									else if (event.type === 'liferay-ddm-repeatable-fields:remove') {
										delete validatorRules[fieldInputName];

										var validatorField = liferayForm.formValidator.getField(fieldInputName);

										if (validatorField) {
											liferayForm.formValidator.resetField(validatorField);
										}
									}

									liferayForm.formValidator.set('rules', validatorRules);
								}
							}
						);
					},

					syncUI: function() {
						var instance = this;

						instance.syncFieldsTreeUI();
					},

					createFieldTree: function(fieldNode) {
						var instance = this;

						var fieldName = fieldNode.getData('fieldName');
						var fieldNamespace = fieldNode.getData('fieldNamespace');

						var tree = [fieldName + fieldNamespace];

						instance.getFieldsList(null, fieldNode).each(
							function(item, index, collection) {
								tree = tree.concat(instance.createFieldTree(item));
							}
						);

						return tree;
					},

					getField: function(fieldName, callback) {
						var instance = this;

						A.io.request(
							themeDisplay.getPathMain() + '/dynamic_data_mapping/render_structure_field',
							{
								data: {
									classNameId: instance.get('classNameId'),
									classPK: instance.get('classPK'),
									controlPanelCategory: 'portlet',
									doAsGroupId: instance.get('doAsGroupId'),
									fieldName: fieldName,
									namespace: instance.get('namespace'),
									p_l_id: instance.get('p_l_id'),
									p_p_id: '166',
									p_p_isolated: true,
									portletNamespace: instance.get('portletNamespace'),
									readOnly: instance.get('readOnly')
								},
								on: {
									success: function(event, id, xhr) {
										if (callback) {
											callback.call(instance, xhr.responseText);
										}
									}
								}
							}
						);
					},

					getFieldInputName: function(fieldNode) {
						var instance = this;

						var portletNamespace = instance.get('portletNamespace');
						var namespace = instance.get('namespace');

						var prefix = [portletNamespace];

						if (namespace) {
							prefix.push(namespace);
						}

						return prefix.concat(
							[
								fieldNode.getData('fieldName'),
								fieldNode.getData('fieldNamespace')
							]
						).join('');
					},

					getFieldParentNode: function(fieldNode) {
						var instance = this;

						var parentNode = fieldNode.ancestor('.field-wrapper');

						if (!parentNode) {
							parentNode = instance.get('container');
						}

						return parentNode;
					},

					getFieldsList: function(fieldName, parentNode) {
						var instance = this;

						var container;

						if (parentNode) {
							container = parentNode;
						}
						else {
							container = instance.get('container');
						}

						var selector = ['>'];

						selector.push(' .field-wrapper');

						if (fieldName) {
							selector.push('[data-fieldName="' + fieldName + '"]');
						}

						return container.all(selector.join(''));
					},

					insertField: function(fieldNode) {
						var instance = this;

						instance.getField(
							fieldNode.getData('fieldName'),
							function(newFieldHTML) {

								fieldNode.insert(newFieldHTML, 'after');
								instance._addFieldValidation(fieldNode.next(), fieldNode);
								instance.syncFieldsTreeUI();

                                // Start custom changed
                                instance.get('container').fire('ddmContainer:fieldInserted', {
                                    nodeId: fieldNode.next().get('id')
                                });
                                // End custom added
							}
						);

					},

					removeField: function(fieldNode) {
						var instance = this;

						instance._removeFieldValidation(fieldNode);

						fieldNode.remove();

						var eventHandlers = RepeatableFields.eventHandlers[instance.getFieldInputName(fieldNode)];

						A.Array.invoke(eventHandlers, 'detach');

						instance.syncFieldsTreeUI();
					},

					renderRepeatableUI: function(fieldNode) {
						var instance = this;

						var fieldRepeatable = A.DataType.Boolean.parse(fieldNode.getData('repeatable'));

						if (instance.get('repeatable') && fieldRepeatable) {
							if (!fieldNode.getData('rendered-toolbar')) {
								var fieldName = fieldNode.getData('fieldName');

								var parentNode = instance.getFieldParentNode(fieldNode);

								var fieldsList = instance.getFieldsList(fieldName, parentNode);

								var html = TPL_ADD_REPEATABLE;

								if (fieldsList.indexOf(fieldNode) > 0) {
									html += TPL_DELETE_REPEATABLE;
								}

								fieldNode.append(html);

								fieldNode.plug(A.Plugin.ParseContent);

								fieldNode.setData('rendered-toolbar', true);
							}
						}

						instance.getFieldsList(null, fieldNode).each(
							function(item, index, collection) {
								instance.renderRepeatableUI(item);
							}
						);
					},

					syncFieldsTreeUI: function() {
						var instance = this;

						var fieldsDisplay = [];

						var fieldsDisplayInput = instance.get('fieldsDisplayInput');

						instance.getFieldsList().each(
							function(item, index, collection) {
								instance.renderRepeatableUI(item);

								fieldsDisplay = fieldsDisplay.concat(instance.createFieldTree(item));
							}
						);

						fieldsDisplayInput.val(fieldsDisplay.join());
					},

					_addFieldValidation: function(newFieldNode, originalFieldNode) {
						var instance = this;

						instance.fire(
							'repeat',
							{
								fieldNode: newFieldNode,
								originalFieldNode: originalFieldNode
							}
						);

						var newFieldsList = instance.getFieldsList(null, newFieldNode);

						newFieldsList.each(
							function(item) {
								var fieldName = item.getData('fieldName');

								var originalChildFieldNode = instance.getFieldsList(fieldName, originalFieldNode).first();

								instance._addFieldValidation(item, originalChildFieldNode);
							}
						);
					},

					_afterFormRegistered: function(event) {
						var instance = this;

						var container = instance.get('container');

						var formNode = container.ancestor('form', true);

						if (formNode && (event.formName === formNode.attr('name'))) {
							instance.liferayForm = event.form;
						}
					},

					_onClickRepeatableButton: function(event) {
						var instance = this;

						var currentTarget = event.currentTarget;

						var fieldNode = currentTarget.ancestor('.field-wrapper');

						if (currentTarget.hasClass('lfr-ddm-repeatable-add-button')) {
							instance.insertField(fieldNode);
						}
						else if (currentTarget.hasClass('lfr-ddm-repeatable-delete-button')) {
							instance.removeField(fieldNode);
						}
					},

					_onHoverRepeatableButton: function(event) {
						var instance = this;

						var fieldNode = event.currentTarget.ancestor('.field-wrapper');

						fieldNode.toggleClass('lfr-ddm-repeatable-active', (event.phase === 'over'));
					},

					_removeFieldValidation: function(fieldNode) {
						var instance = this;

						var newFieldsList = instance.getFieldsList(null, fieldNode);

						newFieldsList.each(
							function(item) {
								instance._removeFieldValidation(item);
							}
						);

						instance.fire(
							'remove',
							{
								fieldNode: fieldNode
							}
						);
					}
				}
			}
		);

		Liferay.namespace('DDM').RepeatableFields = RepeatableFields;
	},
	'',
	{
		requires: ['aui-base', 'aui-datatype', 'aui-io-request', 'aui-parse-content']
	}
);