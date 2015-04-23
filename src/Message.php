<?php

namespace DJB\Confer;

use Illuminate\Database\Eloquent\Model;

class Message extends Model {
	
	protected $fillable = ['body', 'conversation_id', 'sender_id', 'type'];
	protected $table = 'confer_messages';
	protected $guarded = ['id'];

	/**
	 * Get the conversation the message belongs to
	 * 
	 * @return belongsTo
	 */
	public function conversation()
	{
		return $this->belongsTo('DJB\Confer\Conversation', 'conversation_id');
	}

	/**
	 * Get the user who sent the message
	 * 
	 * @return belongsTo
	 */
	public function sender()
	{
		return $this->belongsTo('App\User', 'sender_id');
	}

	public function getEventData($type = 'private')
	{
		return $type === 'global' ? ['conversation' => $this->conversation, 'message' => $this, 'sender' => $this->sender] : ['conversation' => $this->conversation, 'message' => $this, 'sender' => $this->sender];
	}

}