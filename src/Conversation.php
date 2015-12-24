<?php

namespace DJB\Confer;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model {
	
	protected $fillable = ['name', 'is_private'];
	protected $table = 'confer_conversations';
	protected $guarded = ['id'];

	// Relationships
	
	/**
	 * Get the participants of the conversation
	 * 
	 * @return belongsToMany
	 */
	public function participants()
	{
		return $this->belongsToMany('App\User', 'confer_conversation_participants', 'user_id', 'conversation_id');
	}

	/**
	 * Get the messages in the conversation
	 * 
	 * @return hasMany
	 */
	public function messages()
	{
		return $this->hasMany('DJB\Confer\Message', 'conversation_id');
	}

	public function isGlobal()
	{
		return $this->id == 1;
	}

	public function isPrivate()
	{
		return $this->is_private;
	}

	public function getChannel()
	{
		return 'private-conversation-' . $this->id;
	}

	/**
	 * Get the users who could be invited into the conversation
	 * 
	 * @return Collection
	 */
	public function getPotentialInvitees()
	{
		$current_participants = $this->participants()->lists('id');
		return \App\User::whereNotIn('id', $current_participants)->get();

	}

	public function createNewWithAdditionalParticipants(Array $users, $name)
	{
		$conversation = $this->create([
			'name' => empty($name) ? 'Opps, I forgot to write a name - how embarrassing' : ucwords($name),
			'is_private' => false
		]);

		$current_participants = $this->participants()->lists('id');
		$conversation->participants()->sync(array_merge($current_participants, $users));

		return $conversation;
	}

	public function addAdditionalParticipants(Array $users)
	{
		//$this->participants()->attach($users); cannot use this method due to SQL 2005
		$this->participants()->sync(array_merge($this->participants()->lists('id'), $users));
	}

	public static function findOrCreateBetween(\App\User $user, \App\User $other_user)
	{
		$user_participates = $user->privateConversations();
		$other_user_participates = $other_user->privateConversations();

		$static = new static;

		$shared_participations = collect(array_intersect($user_participates, $other_user_participates));
		return $shared_participations->isEmpty() ? $static->createBetween($user, $other_user) : $static->find($shared_participations->first());
	}

	public function createBetween($user, $other_user)
	{
		$conversation = $this->create([
			'name' => 'Conversation between ' . $user->name . ' and ' . $other_user->name,
			'is_private' => true
		]);

		$conversation->participants()->sync([$user->id, $other_user->id]);

		return $conversation;
		//$user->conversations()->attach($conversation->id);
		//$other_user->conversations()->attach($conversation->id);
	}

	public function scopeIgnoreGlobal($query)
	{
		return $query->where('id', '<>', 1);
	}

	public function scopeIsPrivate($query)
	{
		return $query->where('is_private', true);
	}

}