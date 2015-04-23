<?php

namespace DJB\Confer\Traits;

use Auth;

trait CanConfer {
	
	/**
	 * Get the required data for presence
	 * 
	 * @return Array
	 */
	public function getPresenceData()
	{
		return [
			'name' => $this->name
		];
	}

	public function getBarConversations()
	{
		return $this->conversations()->where('is_private', false)->ignoreGlobal()->with('messages.sender')->orderBy('updated_at', 'DESC')->take(3)->get();
	}

	/**
	 * Filter query to not include current user
	 * 
	 * @param  $query
	 * @return $query
	 */
	public function scopeIgnoreMe($query)
	{
		return $query->where('id', '<>', Auth::user()->id);
	}

	/**
	 * Get the conversations that this user participates in
	 * 
	 * @return belongsToMany
	 */
	public function conversations()
	{
		return $this->belongsToMany('DJB\Confer\Conversation', 'confer_conversation_participants', 'conversation_id', 'user_id');
	}

	/**
	 * Identify whether a user participates in a conversation based on it's ID
	 * 
	 * @param  String $conversation_id
	 * @return boolean
	 */
	public function participatesIn($conversation_id)
	{
		return ! $this->conversations()->where('id', $conversation_id)->get()->isEmpty();
	}

	/**
	 * Get the IDs of the conversations that the user participates in
	 *
	 * Global channel is ignored
	 * 
	 * @return Array
	 */
	public function participatingConversations()
	{
		return $this->conversations()->ignoreGlobal()->lists('id');
	}

	public function privateConversations()
	{
		return $this->conversations()->isPrivate()->lists('id');
	}

	public function leaveConversation(\DJB\Confer\Conversation $conversation)
	{
		$this->conversations()->detach($conversation->id);
	}

	/**
	 * Get the messages that the user has sent
	 * 
	 * @return hasMany
	 */
	public function sent()
	{
		return $this->hasMany('DJB\Confer\Message', 'sender_id');
	}

}