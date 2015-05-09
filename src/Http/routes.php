<?php

Route::model('conferconversation', 'DJB\Confer\Conversation');
Route::model('conferuser', 'App\User');

Route::any('confer/auth', ['as' => 'confer.pusher.auth', 'uses' => 'DJB\Confer\Http\Controllers\ConversationController@authenticate']);
Route::get('confer/test', 'DJB\Confer\Http\Controllers\ConversationController@test');
Route::get('confer/settings', 'DJB\Confer\Http\Controllers\ConversationController@settings');
Route::get('confer/conversations/bar', 'DJB\Confer\Http\Controllers\ConversationController@barIndex');
Route::get('confer/conversations', 'DJB\Confer\Http\Controllers\ConversationController@index');
Route::get('confer/users', ['as' => 'confer.users.list', 'uses' => 'DJB\Confer\Http\Controllers\ConversationController@listUsers']);
Route::post('confer/user/{conferuser}/info', ['as' => 'confer.user.info', 'uses' => 'DJB\Confer\Http\Controllers\ConversationController@getUserInfo']);
Route::post('confer/user/{conferuser}/conversation/{conferconversation}/info', ['as' => 'confer.user.conversation.info', 'uses' => 'DJB\Confer\Http\Controllers\ConversationController@getUserAndConversationInfo']);
Route::get('confer/conversation/{conferconversation}', ['as' => 'confer.conversation.show', 'uses' => 'DJB\Confer\Http\Controllers\ConversationController@show']);
Route::post('confer/conversation/{conferconversation}/info', ['as' => 'confer.conversation.info', 'uses' => 'DJB\Confer\Http\Controllers\ConversationController@info']);
Route::post('confer/conversation/{conferconversation}/requested', ['as' => 'confer.conversation.requested', 'uses' => 'DJB\Confer\Http\Controllers\ConversationController@requested']);
Route::get('confer/conversation/find/user/{conferuser}', ['as' => 'confer.conversation.find', 'uses' => 'DJB\Confer\Http\Controllers\ConversationController@find']);
Route::delete('confer/conversation/{conferconversation}/leave', ['as' => 'confer.conversation.participant.delete', 'uses' => 'DJB\Confer\Http\Controllers\ConversationController@leave']);

Route::get('confer/conversation/{conferconversation}/messages', ['as' => 'confer.conversation.messages.show', 'uses' => 'DJB\Confer\Http\Controllers\ConversationController@showMoreMessages']);
Route::post('confer/conversation/{conferconversation}/messages', ['as' => 'confer.conversation.message.store', 'uses' => 'DJB\Confer\Http\Controllers\MessageController@store']);

Route::get('confer/conversation/{conferconversation}/invite', ['as' => 'confer.conversation.invite.show', 'uses' => 'DJB\Confer\Http\Controllers\ConversationController@showInvite']);
Route::patch('confer/conversation/{conferconversation}', ['as' => 'confer.conversation.update', 'uses' => 'DJB\Confer\Http\Controllers\ConversationController@update']);

Route::post('confer/session', ['as' => 'confer.session.store', 'uses' => 'DJB\Confer\Http\Controllers\SessionController@store']);
Route::patch('confer/requests/session', ['as' => 'confer.session.update', 'uses' => 'DJB\Confer\Http\Controllers\SessionController@update']);
Route::get('confer/session/clear', ['as' => 'confer.session.destroy', 'uses' => 'DJB\Confer\Http\Controllers\SessionController@destroy']);